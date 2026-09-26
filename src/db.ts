import { defaultContent, normalizeContent, type SiteContent } from "./content";
import { randomToken, sha256 } from "./util";

export const DEFAULT_PASSWORD = "LaCoche5538";

const SCHEMA = [
	`CREATE TABLE IF NOT EXISTS site_content (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		data TEXT NOT NULL,
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`,
	`CREATE TABLE IF NOT EXISTS admin_auth (
		id INTEGER PRIMARY KEY CHECK (id = 1),
		password_hash TEXT NOT NULL,
		salt TEXT NOT NULL,
		password_changed INTEGER NOT NULL DEFAULT 0
	)`,
	`CREATE TABLE IF NOT EXISTS sessions (
		token_hash TEXT PRIMARY KEY,
		expires_at INTEGER NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS bookings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		phone TEXT NOT NULL,
		email TEXT NOT NULL DEFAULT '',
		service TEXT NOT NULL DEFAULT '',
		zone TEXT NOT NULL DEFAULT '',
		preferred_date TEXT NOT NULL DEFAULT '',
		message TEXT NOT NULL DEFAULT '',
		status TEXT NOT NULL DEFAULT 'nouveau',
		created_at TEXT NOT NULL
	)`,
];

let ready: Promise<void> | null = null;

export function ensureDb(env: Env): Promise<void> {
	if (!ready) {
		ready = prepareDb(env).catch((error) => {
			ready = null;
			throw error;
		});
	}
	return ready;
}

async function prepareDb(env: Env): Promise<void> {
	await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
	await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(Date.now()).run();

	const existing = await env.DB.prepare("SELECT id FROM site_content WHERE id = 1").first();
	if (!existing) {
		await env.DB.prepare(
			"INSERT INTO site_content (id, data, updated_at) VALUES (1, ?, datetime('now'))",
		)
			.bind(JSON.stringify(defaultContent))
			.run();
	}

	const auth = await env.DB.prepare("SELECT id FROM admin_auth WHERE id = 1").first();
	if (!auth) {
		const salt = randomToken().slice(0, 32);
		const passwordHash = await sha256(`${salt}:${DEFAULT_PASSWORD}`);
		await env.DB.prepare(
			"INSERT INTO admin_auth (id, password_hash, salt, password_changed) VALUES (1, ?, ?, 0)",
		)
			.bind(passwordHash, salt)
			.run();
	}
}

export async function getContent(env: Env): Promise<SiteContent> {
	const row = await env.DB.prepare("SELECT data FROM site_content WHERE id = 1").first<{ data: string }>();
	if (!row) return structuredClone(defaultContent);
	try {
		return normalizeContent(JSON.parse(row.data));
	} catch {
		return structuredClone(defaultContent);
	}
}

export async function saveContent(env: Env, content: SiteContent): Promise<void> {
	const data = JSON.stringify(content);
	await env.DB.prepare(
		`INSERT INTO site_content (id, data, updated_at) VALUES (1, ?, datetime('now'))
		 ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
	)
		.bind(data)
		.run();
}

export interface AuthRow {
	password_hash: string;
	salt: string;
	password_changed: number;
}

export async function getAuth(env: Env): Promise<AuthRow> {
	const row = await env.DB.prepare(
		"SELECT password_hash, salt, password_changed FROM admin_auth WHERE id = 1",
	).first<AuthRow>();
	if (!row) throw new Error("Auth manquante.");
	return row;
}

export async function setPassword(env: Env, password: string): Promise<void> {
	const salt = randomToken().slice(0, 32);
	const passwordHash = await sha256(`${salt}:${password}`);
	await env.DB.prepare(
		"UPDATE admin_auth SET password_hash = ?, salt = ?, password_changed = 1 WHERE id = 1",
	)
		.bind(passwordHash, salt)
		.run();
	await env.DB.prepare("DELETE FROM sessions").run();
}

export interface BookingRow {
	id: number;
	name: string;
	phone: string;
	email: string;
	service: string;
	zone: string;
	preferred_date: string;
	message: string;
	status: string;
	created_at: string;
}

export async function createBooking(
	env: Env,
	input: {
		name: string;
		phone: string;
		email: string;
		service: string;
		zone: string;
		preferredDate: string;
		message: string;
	},
): Promise<void> {
	await env.DB.prepare(
		`INSERT INTO bookings (name, phone, email, service, zone, preferred_date, message, status, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'nouveau', ?)`,
	)
		.bind(
			input.name,
			input.phone,
			input.email,
			input.service,
			input.zone,
			input.preferredDate,
			input.message,
			new Date().toISOString(),
		)
		.run();
}

export async function listBookings(env: Env): Promise<BookingRow[]> {
	const { results } = await env.DB.prepare(
		"SELECT id, name, phone, email, service, zone, preferred_date, message, status, created_at FROM bookings ORDER BY id DESC LIMIT 200",
	).all<BookingRow>();
	return results;
}

export async function updateBookingStatus(env: Env, id: number, status: string): Promise<void> {
	await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(status, id).run();
}

export async function deleteBooking(env: Env, id: number): Promise<void> {
	await env.DB.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
}
