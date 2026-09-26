import { renderFou } from "./fou";
import { renderHtml } from "./renderHtml";

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/favicon.ico") {
			return new Response(null, { status: 204 });
		}

		if (url.pathname === "/classique") {
			const stmt = env.DB.prepare("SELECT * FROM comments LIMIT 3");
			const { results } = await stmt.all();
			return new Response(renderHtml(JSON.stringify(results, null, 2)), {
				headers: { "content-type": "text/html; charset=utf-8" },
			});
		}

		return new Response(renderFou(), {
			headers: {
				"content-type": "text/html; charset=utf-8",
				"cache-control": "no-store",
			},
		});
	},
} satisfies ExportedHandler<Env>;
