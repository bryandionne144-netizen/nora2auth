import { readFileSync, writeFileSync } from "node:fs";
import * as esbuild from "esbuild";

const bundled = esbuild.buildSync({
	stdin: {
		contents: `export { defaultContent } from "./src/content.ts";\nexport { jsonForScript } from "./src/util.ts";\n`,
		resolveDir: new URL("..", import.meta.url).pathname,
		loader: "ts",
	},
	bundle: true,
	platform: "node",
	format: "esm",
	write: false,
});
const modUrl = `data:text/javascript,${encodeURIComponent(bundled.outputFiles[0].text)}`;
const { defaultContent, jsonForScript } = await import(modUrl);

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const logo = readFileSync(new URL("public/logo.png", root)).toString("base64");

function hideScript(text) {
	return String(text).replace(/<\/script/gi, "<\\/script");
}
function plain(id, text) {
	return `<script type="text/plain" id="${id}">${hideScript(text)}</script>`;
}
function exec(text) {
	return `<script>${hideScript(text)}</script>`;
}

const html = `<!DOCTYPE html>
<html lang="fr" data-studio="1">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#05070c" />
  <title>La Coche</title>
  <link rel="icon" href="data:image/png;base64,${logo}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <style>
${read("public/site.css")}
  </style>
  <style>
    #admin-layer { position: fixed; inset: 0; z-index: 80; background: #05070c; }
    #admin-layer[hidden] { display: none !important; }
    #admin-frame { width: 100%; height: 100%; border: 0; background: #05070c; }
    body.admin-open { overflow: hidden; }
  </style>
</head>
<body>
  <div id="site-root"></div>
  <div id="admin-layer" hidden>
    <iframe id="admin-frame" title="Espace pro"></iframe>
  </div>
  <script type="application/json" id="lc-default">${jsonForScript(defaultContent)}</script>
  ${plain("lc-logo", `data:image/png;base64,${logo}`)}
  ${plain("lc-admin-css", read("public/admin.css"))}
  ${plain("lc-render", read("public/render-site.js"))}
  ${plain("lc-admin-js", read("public/admin.js"))}
  ${exec(read("public/render-site.js"))}
  ${exec(read("public/site.js"))}
  ${exec(read("public/studio.js"))}
</body>
</html>
`;

writeFileSync(new URL("html/la-coche.html", root), html);
console.log(`html/la-coche.html ${html.length} bytes`);
