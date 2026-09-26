import { clearCookie, isAuthed, login, logout, sessionCookie, tooManyAttempts, verifyPassword } from "./auth";
import { normalizeContent, type SiteContent } from "./content";
import {
	createBooking,
	deleteBooking,
	getAuth,
	getContent,
	listBookings,
	saveContent,
	setPassword,
	updateBookingStatus,
} from "./db";
import { json } from "./http";
import { clientIp, contentVersion, isObj, sameOrigin, todayInToronto } from "./util";

const SYNC_CORS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "POST, OPTIONS",
	"access-control-allow-headers": "content-type",
	"access-control-max-age": "86400",
};

const BOOKING_STATUS = new Set(["nouveau", "confirme", "fait", "annule"]);
const bookingHits = new Map<string, { n: number; reset: number }>();

function tooManyBookings(request: Request): boolean {
	const ip = clientIp(request);
	const now = Date.now();
	const row = bookingHits.get(ip);
	if (!row || row.reset < now) {
		bookingHits.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
		return false;
	}
	row.n += 1;
	return row.n > 8;
}

async function readJson(request: Request): Promise<unknown> {
	const text = await request.text();
	if (text.length > 400_000) throw new Error("Trop gros.");
	return JSON.parse(text);
}

export async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname;
	const method = request.method;

	if (path === "/api/sync" && (method === "OPTIONS" || method === "POST")) {
		return syncLive(request, env, method);
	}

	if (path === "/api/public/content" && method === "GET") {
		const content = await getContent(env);
		return json({ version: contentVersion(content) });
	}

	if (path === "/api/bookings" && method === "POST") {
		if (!sameOrigin(request)) return json({ error: "Origine refusée." }, 403);
		return createPublicBooking(request, env);
	}

	if (path === "/api/admin/login" && method === "POST") {
		if (!sameOrigin(request)) return json({ error: "Origine refusée." }, 403);
		if (tooManyAttempts(request)) return json({ error: "Trop d'essais. Réessayez dans quelques minutes." }, 429);
		let body: unknown;
		try {
			body = await readJson(request);
		} catch {
			return json({ error: "Requête invalide." }, 400);
		}
		const password = isObj(body) && typeof body.password === "string" ? body.password : "";
		const token = await login(env, request, password);
		if (!token) return json({ error: "Mot de passe incorrect." }, 401);
		const auth = await getAuth(env);
		return json(
			{ ok: true, passwordChanged: auth.password_changed === 1 },
			200,
			{ "set-cookie": sessionCookie(token, request) },
		);
	}

	if (path === "/api/admin/logout" && method === "POST") {
		await logout(env, request);
		return json({ ok: true }, 200, { "set-cookie": clearCookie(request) });
	}

	if (!(await isAuthed(env, request))) return json({ error: "Connexion requise." }, 401);

	if (path === "/api/admin/session" && method === "GET") {
		const auth = await getAuth(env);
		return json({ ok: true, passwordChanged: auth.password_changed === 1 });
	}

	if (!sameOrigin(request) && method !== "GET") return json({ error: "Origine refusée." }, 403);

	if (path === "/api/admin/content" && method === "GET") {
		return json(await getContent(env));
	}

	if (path === "/api/admin/normalize" && method === "POST") {
		let body: unknown;
		try {
			body = await readJson(request);
		} catch {
			return json({ error: "Contenu invalide." }, 400);
		}
		return json(normalizeContent(body));
	}

	if (path === "/api/admin/content" && method === "PUT") {
		let body: unknown;
		try {
			body = await readJson(request);
		} catch {
			return json({ error: "Contenu invalide." }, 400);
		}
		const content = normalizeContent(body);
		await saveContent(env, content);
		return json(content);
	}

	if (path === "/api/admin/reset" && method === "POST") {
		const content = normalizeContent({});
		await saveContent(env, content);
		return json(content);
	}

	if (path === "/api/admin/password" && method === "POST") {
		let body: unknown;
		try {
			body = await readJson(request);
		} catch {
			return json({ error: "Requête invalide." }, 400);
		}
		if (!isObj(body) || typeof body.current !== "string" || typeof body.next !== "string") {
			return json({ error: "Requête invalide." }, 400);
		}
		if (body.next.length < 8 || body.next.length > 80) {
			return json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères." }, 400);
		}
		const token = await login(env, request, body.current);
		if (!token) return json({ error: "Mot de passe actuel incorrect." }, 401);
		await setPassword(env, body.next);
		const fresh = await login(env, request, body.next);
		if (!fresh) return json({ error: "Mot de passe mis à jour, reconnectez-vous." }, 401);
		return json({ ok: true }, 200, { "set-cookie": sessionCookie(fresh, request) });
	}

	if (path === "/api/admin/bookings" && method === "GET") {
		return json(await listBookings(env));
	}

	const bookingMatch = path.match(/^\/api\/admin\/bookings\/(\d+)$/);
	if (bookingMatch && method === "PATCH") {
		let body: unknown;
		try {
			body = await readJson(request);
		} catch {
			return json({ error: "Requête invalide." }, 400);
		}
		const status = isObj(body) && typeof body.status === "string" ? body.status : "";
		if (!BOOKING_STATUS.has(status)) return json({ error: "Statut invalide." }, 400);
		await updateBookingStatus(env, Number(bookingMatch[1]), status);
		return json({ ok: true });
	}
	if (bookingMatch && method === "DELETE") {
		await deleteBooking(env, Number(bookingMatch[1]));
		return json({ ok: true });
	}

	return json({ error: "Introuvable." }, 404);
}

async function syncLive(request: Request, env: Env, method: string): Promise<Response> {
	if (method === "OPTIONS") return new Response(null, { status: 204, headers: SYNC_CORS });
	let body: unknown;
	try {
		body = await readJson(request);
	} catch {
		return json({ error: "Contenu invalide." }, 400, SYNC_CORS);
	}
	const password = isObj(body) && typeof body.password === "string" ? body.password : "";
	const verdict = await verifyPassword(env, request, password);
	if (verdict === "limited") {
		return json({ error: "Trop d'essais. Réessayez dans quelques minutes." }, 429, SYNC_CORS);
	}
	if (verdict !== "ok") return json({ error: "Mot de passe incorrect." }, 401, SYNC_CORS);
	const content = normalizeContent(isObj(body) ? body.content : null);
	await saveContent(env, content);
	return json({ ok: true, version: contentVersion(content) }, 200, SYNC_CORS);
}

async function createPublicBooking(request: Request, env: Env): Promise<Response> {
	let body: unknown;
	try {
		body = await readJson(request);
	} catch {
		return json({ error: "Requête invalide." }, 400);
	}
	if (!isObj(body)) return json({ error: "Requête invalide." }, 400);
	if (tooManyBookings(request)) {
		return json({ error: "Trop de demandes. Réessayez dans quelques minutes." }, 429);
	}
	if (typeof body.company === "string" && body.company.trim()) return json({ ok: true });

	const content: SiteContent = await getContent(env);
	if (!content.booking.enabled || !content.sections.booking) {
		return json({ error: content.booking.pauseMessage }, 403);
	}

	const name = typeof body.name === "string" ? body.name.trim() : "";
	const phone = typeof body.phone === "string" ? body.phone.trim() : "";
	const email = typeof body.email === "string" ? body.email.trim() : "";
	const service = typeof body.service === "string" ? body.service.trim() : "";
	const zone = typeof body.zone === "string" ? body.zone.trim() : "";
	const preferredDate = typeof body.date === "string" ? body.date.trim().slice(0, 20) : "";
	if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
		return json({ error: "Date invalide." }, 400);
	}
	if (preferredDate && preferredDate < todayInToronto()) {
		return json({ error: "Choisissez une date à venir." }, 400);
	}
	const message = typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "";

	if (name.length < 2 || name.length > 80) return json({ error: "Indiquez votre nom." }, 400);
	const digits = phone.replace(/\D/g, "");
	if (digits.length < 7 || phone.length > 24) return json({ error: "Indiquez un téléphone valide." }, 400);
	if (email && (email.length > 120 || !email.includes("@"))) {
		return json({ error: "Courriel invalide." }, 400);
	}

	const serviceOk = content.services.some((item) => item.name === service && item.availability === "disponible");
	const zoneOk = content.zones.some((item) => item.name === zone && item.availability === "disponible");
	if (!serviceOk) return json({ error: "Choisissez un soin disponible." }, 400);
	if (!zoneOk) return json({ error: "Choisissez un secteur disponible." }, 400);

	await createBooking(env, { name, phone, email, service, zone, preferredDate, message });
	return json({ ok: true });
}
