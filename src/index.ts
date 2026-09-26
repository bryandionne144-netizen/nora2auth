import { handleApi } from "./api";
import { ensureDb, getContent } from "./db";
import { renderAdmin } from "./adminPage";
import { html, renderStatusPage } from "./http";
import { renderPublic } from "./publicPage";

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		try {
			if (url.pathname.startsWith("/api/")) {
				await ensureDb(env);
				return await handleApi(request, env, url);
			}
			if (url.pathname === "/admin" || url.pathname === "/admin/") {
				return html(renderAdmin());
			}
			if (url.pathname === "/") {
				await ensureDb(env);
				const content = await getContent(env);
				return html(renderPublic(content, url));
			}
			return html(renderStatusPage("Introuvable", "Cette page n'existe pas."), 404);
		} catch (error) {
			console.error(error);
			if (url.pathname.startsWith("/api/")) {
				const headers: Record<string, string> = { "content-type": "application/json; charset=utf-8" };
				if (url.pathname === "/api/sync") headers["access-control-allow-origin"] = "*";
				return Response.json({ error: "Erreur interne." }, { status: 500, headers });
			}
			return html(
				renderStatusPage("Indisponible", "Le site est momentanément indisponible. Réessayez dans un instant."),
				500,
			);
		}
	},
} satisfies ExportedHandler<Env>;
