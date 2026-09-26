export function html(body: string, status = 200): Response {
	return new Response(body, {
		status,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
			"x-content-type-options": "nosniff",
			"referrer-policy": "strict-origin-when-cross-origin",
		},
	});
}

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
	const next = new Headers(headers);
	next.set("content-type", "application/json; charset=utf-8");
	next.set("cache-control", "no-store");
	return new Response(JSON.stringify(data), { status, headers: next });
}

export function renderStatusPage(title: string, text: string): string {
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #05070c; color: #eef6ff; font-family: "Instrument Sans", "Segoe UI", sans-serif; }
    main { text-align: center; padding: 32px; }
    a { color: #8fd7ff; }
    h1 { font-weight: 650; letter-spacing: -0.04em; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${text}</p>
    <p><a href="/">Retour à l'accueil</a></p>
  </main>
</body>
</html>`;
}
