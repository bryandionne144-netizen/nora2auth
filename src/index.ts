import { renderHtml } from "./renderHtml";

type Comment = {
	id?: number;
	author: string;
	content: string;
};

export default {
	async fetch(_request, env) {
		let comments: Comment[] = [];
		try {
			const stmt = env.DB.prepare(
				"SELECT id, author, content FROM comments ORDER BY id ASC LIMIT 6",
			);
			const { results } = await stmt.all<Comment>();
			comments = results ?? [];
		} catch {
			comments = [];
		}

		return new Response(renderHtml(comments), {
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		});
	},
} satisfies ExportedHandler<Env>;
