import { getAuth } from "./db";
import { clientIp, randomToken, readCookie, safeEqual, sha256 } from "./util";

const COOKIE = "lc_session";
const WEEK = 60 * 60 * 24 * 7;
const attempts = new Map<string, { n: number; reset: number }>();

export function tooManyAttempts(request: Request): boolean {
	const ip = clientIp(request);
	const now = Date.now();
	const row = attempts.get(ip);
	if (!row || row.reset < now) return false;
	return row.n >= 8;
}

function recordFailure(request: Request): void {
	const ip = clientIp(request);
	const now = Date.now();
	const row = attempts.get(ip);
	if (!row || row.reset < now) {
		attempts.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
		return;
	}
	row.n += 1;
}

function clearFailures(request: Request): void {
	attempts.delete(clientIp(request));
}

export async function verifyPassword(env: Env, request: Request, password: string): Promise<"ok" | "bad" | "limited"> {
	if (tooManyAttempts(request)) return "limited";
	const auth = await getAuth(env);
	const hash = await sha256(`${auth.salt}:${password}`);
	if (!safeEqual(hash, auth.password_hash)) {
		recordFailure(request);
		return "bad";
	}
	clearFailures(request);
	return "ok";
}

export async function login(env: Env, request: Request, password: string): Promise<string | null> {
	const verdict = await verifyPassword(env, request, password);
	if (verdict !== "ok") return null;
	const token = randomToken();
	const tokenHash = await sha256(token);
	const expires = Date.now() + WEEK * 1000;
	await env.DB.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)").bind(tokenHash, expires).run();
	return token;
}

export function sessionCookie(token: string, request: Request, maxAge = WEEK): string {
	const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
	return `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearCookie(request: Request): string {
	return sessionCookie("", request, 0);
}

export async function isAuthed(env: Env, request: Request): Promise<boolean> {
	const token = readCookie(request.headers.get("cookie"), COOKIE);
	if (!token) return false;
	const tokenHash = await sha256(token);
	const row = await env.DB.prepare("SELECT expires_at FROM sessions WHERE token_hash = ?")
		.bind(tokenHash)
		.first<{ expires_at: number }>();
	if (!row) return false;
	if (row.expires_at < Date.now()) {
		await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
		return false;
	}
	return true;
}

export async function logout(env: Env, request: Request): Promise<void> {
	const token = readCookie(request.headers.get("cookie"), COOKIE);
	if (!token) return;
	const tokenHash = await sha256(token);
	await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
}
