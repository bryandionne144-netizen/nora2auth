(() => {
	const root = document.getElementById("site-root");
	const layer = document.getElementById("admin-layer");
	const frame = document.getElementById("admin-frame");
	if (!root || !layer || !frame) return;

	document.documentElement.dataset.studio = "1";

	function asset(id) {
		const node = document.getElementById(id);
		return node ? node.textContent : "";
	}

	function readJson(id) {
		const raw = asset(id);
		if (!raw.trim()) return null;
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	}

	function storedPack() {
		try {
			const raw = localStorage.getItem("lc_offline_pack");
			if (raw) return JSON.parse(raw);
			const legacy = localStorage.getItem("lc_offline_content");
			if (legacy) return { updatedAt: 1, content: JSON.parse(legacy) };
		} catch {
			return null;
		}
		return null;
	}

	let holdAt = 0;

	function writePack(pack) {
		try {
			localStorage.setItem("lc_offline_pack", JSON.stringify({ updatedAt: pack.updatedAt, content: pack.content }));
			localStorage.setItem("lc_offline_content", JSON.stringify(pack.content));
			if (Array.isArray(pack.bookings)) localStorage.setItem("lc_offline_bookings", JSON.stringify(pack.bookings));
		} catch {
			/* navigation privée */
		}
	}

	let pulling = false;
	let pullQueued = false;

	async function sharePull() {
		if (!globalThis.laCocheCloud) return;
		if (pulling) {
			pullQueued = true;
			return;
		}
		pulling = true;
		try {
			await sharePullOnce();
		} finally {
			pulling = false;
			if (pullQueued) {
				pullQueued = false;
				sharePull();
			}
		}
	}

	async function sharePullOnce() {
		let remote;
		try {
			remote = await globalThis.laCocheCloud.pullShared();
		} catch {
			return;
		}
		const local = storedPack();
		const localTime = local && local.updatedAt ? local.updatedAt : 0;
		if (!remote || !remote.content) {
			if (local && local.content && holdAt < localTime) {
				let bookings = [];
				try {
					bookings = JSON.parse(localStorage.getItem("lc_offline_bookings") || "[]");
				} catch {
					bookings = [];
				}
				sharePush(local.content, Array.isArray(bookings) ? bookings : []);
			}
			return;
		}
		if (local && localTime === remote.updatedAt) return;
		if (local && local.content && localTime > remote.updatedAt) {
			if (holdAt < localTime) {
				let bookings = [];
				try {
					bookings = JSON.parse(localStorage.getItem("lc_offline_bookings") || "[]");
				} catch {
					bookings = [];
				}
				sharePush(local.content, Array.isArray(bookings) ? bookings : []);
			}
			return;
		}
		if (remote.updatedAt < holdAt) return;
		holdAt = remote.updatedAt;
		writePack(remote);
		paint();
		if (frame.contentWindow) frame.contentWindow.postMessage({ type: "lc-remote", pack: remote }, "*");
	}

	function sharePush(content, bookings) {
		if (!globalThis.laCocheCloud || !content) return;
		const pack = { updatedAt: Date.now(), content, bookings: bookings || [] };
		holdAt = pack.updatedAt;
		writePack(pack);
		globalThis.laCocheCloud.pushShared(pack).catch(() => {});
	}

	function activeContent() {
		const filePack = readJson("lc-state");
		const localPack = storedPack();
		const fileTime = filePack && filePack.updatedAt ? filePack.updatedAt : 0;
		const localTime = localPack && localPack.updatedAt ? localPack.updatedAt : 0;
		if (localPack && localPack.content && localTime >= fileTime) return localPack.content;
		if (filePack && filePack.content) return filePack.content;
		const embedded = asset("lc-default");
		return embedded ? JSON.parse(embedded) : null;
	}

	function paint() {
		const base = activeContent();
		if (!base || typeof globalThis.renderLaCoche !== "function") return;
		const content = typeof globalThis.normalizeLaCoche === "function" ? globalThis.normalizeLaCoche(base) : base;
		let html = globalThis.renderLaCoche(content);
		const logo = asset("lc-logo").trim();
		if (logo) {
			html = html.split('href="/logo.png"').join(`href="${logo}"`);
			html = html.split('src="/logo.png"').join(`src="${logo}"`);
			html = html.split("https://lacoche.local/logo.png").join(logo);
		}
		const doc = new DOMParser().parseFromString(html, "text/html");
		doc.querySelectorAll("script").forEach((node) => node.remove());
		const y = window.scrollY;
		root.replaceChildren(...doc.body.childNodes);
		if (doc.title) document.title = doc.title;
		if (typeof globalThis.mountLaCocheSite === "function") globalThis.mountLaCocheSite(root);
		window.scrollTo(0, y);
	}

	function adminDocument() {
		const logo = asset("lc-logo").trim() || "/logo.png";
		const css = asset("lc-admin-css");
		const defaults = asset("lc-default");
		const cloudJs = asset("lc-cloud").replace(/<\/script/gi, "<\\/script");
		const renderJs = asset("lc-render").replace(/<\/script/gi, "<\\/script");
		const adminJs = asset("lc-admin-js").replace(/<\/script/gi, "<\\/script");
		return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Espace pro · La Coche</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>
  <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="grid-bg" aria-hidden="true"></div>
  <div id="login" class="login">
    <form id="login-form" class="login-card">
      <img src="${logo}" alt="" width="92" height="92" />
      <p class="eyebrow">Espace pro</p>
      <h1>La Coche</h1>
      <p class="muted">Le panneau qui pilote le site. Tout ce que les visiteurs voient se modifie ici.</p>
      <label>
        Mot de passe
        <input type="password" name="password" autocomplete="current-password" required />
      </label>
      <p class="form-error" id="login-error" hidden></p>
      <button type="submit">Entrer</button>
    </form>
  </div>
  <div id="app" hidden>
    <aside class="sidebar">
      <a class="side-brand" href="/" target="_blank" rel="noreferrer">
        <img src="${logo}" alt="" />
        <span>
          <strong>La Coche</strong>
          <em>Voir le site</em>
        </span>
      </a>
      <nav id="tabs"></nav>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <a class="view-site" id="view-site" href="/">Voir le site</a>
        <label class="mobile-pick">
          Section
          <select id="tab-select"></select>
        </label>
        <div class="savebar" id="savebar">
          <span id="save-label">À jour</span>
          <button type="button" class="ghost" id="sync-btn" hidden>Synchroniser</button>
          <button type="button" id="save-btn">Enregistrer</button>
        </div>
      </header>
      <div id="banner" class="banner" hidden></div>
      <main id="view"></main>
    </div>
  </div>
  <div id="toast" role="status"></div>
  <script type="application/json" id="lc-default">${defaults}</script>
  <script>${cloudJs}</script>
  <script>${renderJs}</script>
  <script>${adminJs}</script>
</body>
</html>`;
	}

	function openAdmin() {
		if (!frame.dataset.ready) {
			frame.srcdoc = adminDocument();
			frame.dataset.ready = "1";
		}
		layer.hidden = false;
		document.body.classList.add("admin-open");
		if (location.hash !== "#admin") history.replaceState(null, "", "#admin");
	}

	function closeAdmin() {
		const wasOpen = !layer.hidden;
		layer.hidden = true;
		document.body.classList.remove("admin-open");
		if (location.hash === "#admin") history.replaceState(null, "", location.pathname + location.search);
		if (wasOpen) paint();
	}

	root.addEventListener("click", (event) => {
		const link = event.target.closest('a[href="/admin"], a[href="#admin"], a[href="la-coche-admin.html"]');
		if (!link) return;
		event.preventDefault();
		openAdmin();
	});

	window.addEventListener("message", (event) => {
		const data = event.data;
		if (!data || typeof data !== "object") return;
		if (data.type === "lc-refresh") paint();
		if (data.type === "lc-close") closeAdmin();
		if (data.type === "lc-hold") holdAt = Number(data.updatedAt) || Date.now();
	});

	if ("BroadcastChannel" in window) {
		const channel = new BroadcastChannel("la-coche");
		channel.addEventListener("message", (event) => {
			if (event.data && event.data.type === "lc-refresh") paint();
		});
	}

	window.addEventListener("hashchange", () => {
		if (location.hash === "#admin") openAdmin();
		else closeAdmin();
	});

	function applyRemote(pack) {
		if (!pack || !pack.content || pack.updatedAt < holdAt) return;
		const local = storedPack();
		const localTime = local && local.updatedAt ? local.updatedAt : 0;
		if (local && local.content && localTime >= pack.updatedAt) return;
		holdAt = pack.updatedAt;
		writePack(pack);
		paint();
		if (frame.contentWindow) frame.contentWindow.postMessage({ type: "lc-remote", pack }, "*");
	}

	paint();
	if (globalThis.laCocheCloud && typeof laCocheCloud.onShared === "function") {
		laCocheCloud.onShared((pack) => {
			applyRemote(pack);
			sharePull();
		});
	}
	sharePull();
	setInterval(sharePull, 4000);
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") sharePull();
	});
	window.addEventListener("lc-bookings-saved", () => {
		let bookings = [];
		try {
			bookings = JSON.parse(localStorage.getItem("lc_offline_bookings") || "[]");
		} catch {
			bookings = [];
		}
		sharePush(activeContent(), Array.isArray(bookings) ? bookings : []);
	});
	if (location.hash === "#admin") openAdmin();
})();
