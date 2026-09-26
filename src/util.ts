export function esc(value: unknown): string {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function rich(value: unknown): string {
	return esc(value).replace(/\n/g, "<br />");
}

export function jsonForScript(value: unknown): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

export function isObj(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function str(value: unknown, fallback: string, max = 400): string {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	if (!trimmed) return fallback;
	return trimmed.slice(0, max);
}

export function keep(value: unknown, fallback: string, max = 400): string {
	if (typeof value !== "string") return fallback;
	return value.trim().slice(0, max);
}

export function todayInToronto(): string {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Toronto",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(new Date());
}

export function optionalStr(value: unknown, max = 400): string {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, max);
}

export function bool(value: unknown, fallback: boolean): boolean {
	if (typeof value === "boolean") return value;
	return fallback;
}

export function safeUrl(value: unknown): string {
	if (typeof value !== "string") return "";
	const v = value.trim();
	if (!v) return "";
	if (v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\")) {
		return v.slice(0, 400);
	}
	try {
		const url = new URL(v);
		if (url.protocol === "https:" || url.protocol === "http:") {
			return url.toString().slice(0, 500);
		}
	} catch {
		return "";
	}
	return "";
}

export function idOf(value: unknown, prefix: string, index: number): string {
	if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,48}$/.test(value)) return value;
	return `${prefix}-${index + 1}`;
}

export function uniqueIds<T extends { id: string }>(items: T[], prefix: string): T[] {
	const seen = new Set<string>();
	return items.map((item, index) => {
		let id = item.id;
		if (seen.has(id)) id = `${prefix}-${index + 1}`.slice(0, 48);
		seen.add(id);
		return { ...item, id };
	});
}

export async function sha256(value: string): Promise<string> {
	const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
	const len = Math.max(a.length, b.length);
	let out = a.length ^ b.length;
	for (let i = 0; i < len; i++) {
		out |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	}
	return out === 0;
}

export function readCookie(header: string | null, name: string): string | null {
	if (!header) return null;
	for (const part of header.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return null;
}

export function clientIp(request: Request): string {
	return (
		request.headers.get("cf-connecting-ip") ||
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		"local"
	);
}

export function sameOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (!origin) return true;
	try {
		return new URL(origin).host === new URL(request.url).host;
	} catch {
		return false;
	}
}

export function instagramHref(handle: string): string {
	const value = handle.trim();
	if (!value) return "";
	if (value.startsWith("http://") || value.startsWith("https://")) return value;
	const name = value.replace(/^@/, "");
	if (!name) return "";
	return `https://instagram.com/${encodeURIComponent(name)}`;
}

export function telHref(phone: string): string {
	const cleaned = phone.replace(/[^\d+]/g, "");
	return cleaned ? `tel:${cleaned}` : "";
}
