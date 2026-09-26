(() => {
	const TABS = [
		["apercu", "Aperçu"],
		["identite", "Identité"],
		["accueil", "Accueil"],
		["structure", "Structure"],
		["services", "Soins"],
		["zones", "Secteurs"],
		["horaires", "Horaires"],
		["demarche", "Démarche"],
		["galerie", "Galerie"],
		["avis", "Avis"],
		["faq", "Questions"],
		["reservation", "Réservation"],
		["demandes", "Demandes"],
		["compte", "Compte"],
	];
	const SECTION_LABELS = {
		about: "Atelier",
		services: "Soins",
		zones: "Secteurs",
		steps: "Démarche",
		gallery: "Galerie",
		quote: "Citation",
		testimonials: "Avis",
		hours: "Horaires",
		faq: "Questions",
		booking: "Réservation",
	};
	const STATUSES = [
		["nouveau", "Nouveau"],
		["confirme", "Confirmé"],
		["fait", "Fait"],
		["annule", "Annulé"],
	];
	const MOTIFS = [
		["eau", "Eau"],
		["cuir", "Cuir"],
		["chrome", "Chrome"],
		["bac", "Bac"],
		["jantes", "Jantes"],
		["nuit", "Nuit"],
	];

	const DEFAULT_PASSWORD = "LaCoche5538";
	const state = {
		content: null,
		bookings: [],
		tab: "apercu",
		dirty: false,
		passwordChanged: true,
		mode: "server",
	};
	let memoryPassword = "";

	function storage() {
		try {
			const key = "lc_storage_probe";
			localStorage.setItem(key, "1");
			localStorage.removeItem(key);
			return localStorage;
		} catch {
			return null;
		}
	}

	function readStore(key) {
		const box = storage();
		if (!box) return null;
		try {
			const raw = box.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	function writeStore(key, value) {
		const box = storage();
		if (!box) return false;
		box.setItem(key, JSON.stringify(value));
		return true;
	}

	function defaultContent() {
		const node = document.getElementById("lc-default");
		if (!node) return null;
		return JSON.parse(node.textContent);
	}

	function currentPassword() {
		return memoryPassword || readStore("lc_offline_password") || DEFAULT_PASSWORD;
	}

	function assetText(id) {
		const node = document.getElementById(id);
		return node ? node.textContent : "";
	}

	function buildSiteHtml(content) {
		if (typeof globalThis.renderLaCoche !== "function") return "";
		let html = globalThis.renderLaCoche(content);
		const css = assetText("lc-site-css");
		const js = assetText("lc-site-js");
		const logo = assetText("lc-logo").trim();
		if (css) html = html.replace('<link rel="stylesheet" href="/site.css" />', `<style>\n${css}\n</style>`);
		if (js) html = html.replace('<script src="/site.js"></script>', `<script>\n${js.replace(/<\/script>/g, "<\\/script>")}\n</script>`);
		if (logo) {
			html = html.split('href="/logo.png"').join(`href="${logo}"`);
			html = html.split('src="/logo.png"').join(`src="${logo}"`);
			html = html.split("https://lacoche.local/logo.png").join(logo);
		}
		return html.split('href="/admin"').join('href="la-coche-admin.html"');
	}

	function downloadText(filename, text, type) {
		const blob = new Blob([text], { type });
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(link.href), 2000);
	}

	function persistOffline() {
		const savedContent = writeStore("lc_offline_content", state.content);
		writeStore("lc_offline_bookings", state.bookings);
		return savedContent;
	}

	const esc = (value) =>
		String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

	const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

	const listOf = (name) => (name === "points" ? state.content.about.points : state.content[name]);

	const blank = {
		services: () => ({ id: uid("svc"), name: "Nouveau soin", category: "Extérieur", description: "Décrivez le soin.", price: "Dès 0 $", duration: "30 min", availability: "disponible", featured: false }),
		zones: () => ({ id: uid("zone"), name: "Nouveau secteur", area: "", description: "Décrivez le secteur.", availability: "disponible" }),
		hours: () => ({ id: uid("hour"), day: "Jour", hours: "9 h – 17 h", closed: false }),
		steps: () => ({ id: uid("step"), title: "Nouvelle étape", text: "Décrivez l'étape." }),
		gallery: () => ({ id: uid("gal"), title: "Nouveau visuel", caption: "", imageUrl: "", motif: "eau", visible: true }),
		testimonials: () => ({ id: uid("avis"), name: "Client", area: "", text: "Le commentaire.", stars: 5, visible: true }),
		faq: () => ({ id: uid("faq"), question: "Nouvelle question", answer: "La réponse." }),
		stats: () => ({ id: uid("stat"), value: "1", label: "libellé" }),
		points: () => ({ id: uid("pt"), title: "Nouveau point", text: "Le détail." }),
	};

	function toast(message) {
		const node = document.getElementById("toast");
		node.textContent = message;
		node.classList.add("show");
		clearTimeout(toast.timer);
		toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
	}

	function updateSave() {
		document.getElementById("save-label").textContent = state.dirty ? "Modifications non enregistrées" : "À jour";
		document.getElementById("save-btn").disabled = !state.dirty;
	}

	function showBanner() {
		const banner = document.getElementById("banner");
		if (state.mode === "file") {
			banner.hidden = false;
			banner.textContent = "Fichier ouvert sur ton ordinateur. Le bouton Enregistrer télécharge le site mis à jour : remplace l'ancien la-coche-site.html.";
			return;
		}
		if (state.passwordChanged) {
			banner.hidden = true;
			return;
		}
		banner.hidden = false;
		banner.textContent = "Le mot de passe initial est encore actif. Changez-le dans Compte avant de partager l'adresse de l'espace pro.";
	}

	function setPath(path, value) {
		const parts = path.split(".");
		let cursor = state.content;
		for (let i = 0; i < parts.length - 1; i += 1) cursor = cursor[parts[i]];
		cursor[parts[parts.length - 1]] = value;
		state.dirty = true;
		updateSave();
	}

	function field(label, bind, value, type = "text") {
		return `<label class="f">${esc(label)}<input data-bind="${esc(bind)}" type="${esc(type)}" value="${esc(value)}" /></label>`;
	}
	function area(label, bind, value) {
		return `<label class="f">${esc(label)}<textarea data-bind="${esc(bind)}">${esc(value)}</textarea></label>`;
	}
	function check(label, bind, checked) {
		return `<label class="check"><input data-bind="${esc(bind)}" type="checkbox" ${checked ? "checked" : ""} /><span>${esc(label)}</span></label>`;
	}
	function options(selected, pairs) {
		return pairs.map(([value, label]) => `<option value="${esc(value)}"${value === selected ? " selected" : ""}>${esc(label)}</option>`).join("");
	}
	function avail(list, id, value) {
		return `<select data-list="${esc(list)}" data-id="${esc(id)}" data-field="availability">${options(value, [["disponible", "Disponible"], ["indisponible", "Indisponible"]])}</select>`;
	}
	function actions(list, id) {
		return `<div class="row-actions">
      <button type="button" data-action="move" data-list="${esc(list)}" data-id="${esc(id)}" data-dir="-1" aria-label="Monter">↑</button>
      <button type="button" data-action="move" data-list="${esc(list)}" data-id="${esc(id)}" data-dir="1" aria-label="Descendre">↓</button>
      <button type="button" data-action="remove" data-list="${esc(list)}" data-id="${esc(id)}">Retirer</button>
    </div>`;
	}
	function addButton(list, label) {
		return `<button type="button" class="ghost" data-action="add" data-list="${esc(list)}">${esc(label)}</button>`;
	}
	function inputItem(list, id, fieldName, label, value, type = "text") {
		return `<label class="f">${esc(label)}<input data-list="${esc(list)}" data-id="${esc(id)}" data-field="${esc(fieldName)}" type="${esc(type)}" value="${esc(value)}" /></label>`;
	}
	function areaItem(list, id, fieldName, label, value) {
		return `<label class="f">${esc(label)}<textarea data-list="${esc(list)}" data-id="${esc(id)}" data-field="${esc(fieldName)}">${esc(value)}</textarea></label>`;
	}

	function renderNav() {
		document.getElementById("tabs").innerHTML = TABS.map(
			([id, label]) =>
				`<button type="button" data-tab="${id}" class="${state.tab === id ? "on" : ""}">${esc(label)}${id === "demandes" ? '<em id="badge-demandes"></em>' : ""}</button>`,
		).join("");
		document.getElementById("tab-select").innerHTML = TABS.map(([id, label]) => `<option value="${id}">${esc(label)}</option>`).join("");
	}

	function render() {
		const views = {
			apercu: renderHomeDash,
			identite: renderIdentity,
			accueil: renderHero,
			structure: renderStructure,
			services: renderServices,
			zones: renderZones,
			horaires: renderHours,
			demarche: renderSteps,
			galerie: renderGallery,
			avis: renderReviews,
			faq: renderFaq,
			reservation: renderBookingSettings,
			demandes: renderBookings,
			compte: renderAccount,
		};
		try {
			document.getElementById("view").innerHTML = (views[state.tab] || renderHomeDash)();
		} catch (error) {
			document.getElementById("view").innerHTML = `<section class="card"><h2>Affichage impossible</h2><p class="hint">Le contenu chargé est incomplet. Recharge la page sans enregistrer.</p></section>`;
			toast(error.message || "Affichage impossible.");
		}
		document.querySelectorAll("#tabs [data-tab]").forEach((button) => button.classList.toggle("on", button.dataset.tab === state.tab));
		document.getElementById("tab-select").value = state.tab;
		const badge = document.getElementById("badge-demandes");
		if (badge) {
			const count = state.bookings.filter((item) => item.status === "nouveau").length;
			badge.textContent = count ? String(count) : "";
		}
	}

	function renderHomeDash() {
		const c = state.content;
		const fresh = state.bookings.filter((item) => item.status === "nouveau").length;
		return `<section class="card">
      <h2>Disponibilité du moment</h2>
      <p class="hint">Ce statut s'affiche en haut de l'accueil. Les prix « Dès … » et les avis déjà écrits sont des exemples : ajustez-les avant de partager le site.</p>
      <div class="states">
        ${["ouvert", "complet", "ferme"].map((value) => `<button type="button" data-action="status" data-value="${value}" class="${c.status.state === value ? "on" : ""}">${value === "ouvert" ? "Ouvert" : value === "complet" ? "Complet" : "Fermé"}</button>`).join("")}
      </div>
      ${field("Message affiché", "status.message", c.status.message)}
      ${check("Afficher le bandeau d'annonce", "announcement.enabled", c.announcement.enabled)}
      ${field("Texte du bandeau", "announcement.text", c.announcement.text)}
      ${check("Accepter les demandes en ligne", "booking.enabled", c.booking.enabled)}
    </section>
    <section class="card">
      <h2>Demandes</h2>
      <div class="stats-line">
        <div class="stat"><b>${fresh}</b><span>nouvelles</span></div>
        <div class="stat"><b>${state.bookings.length}</b><span>au total</span></div>
      </div>
      <p><button type="button" class="ghost" data-action="goto" data-tab="demandes">Ouvrir les demandes</button></p>
    </section>
    <section class="card">
      <h2>Soins</h2>
      ${c.services.map((item) => `<div class="quick"><div><strong>${esc(item.name)}</strong><small>${esc(item.price)} · ${esc(item.category)}</small></div>${avail("services", item.id, item.availability)}</div>`).join("") || "<p>Aucun soin.</p>"}
    </section>
    <section class="card">
      <h2>Secteurs</h2>
      ${c.zones.map((item) => `<div class="quick"><div><strong>${esc(item.name)}</strong><small>${esc(item.area)}</small></div>${avail("zones", item.id, item.availability)}</div>`).join("") || "<p>Aucun secteur.</p>"}
    </section>
    <section class="card">
      <h2>Note interne</h2>
      <p class="hint">Visible seulement ici. Les visiteurs ne la voient pas.</p>
      ${area("Note", "internalNote", c.internalNote)}
    </section>`;
	}

	function renderIdentity() {
		const b = state.content.brand;
		const n = state.content.nav;
		return `<section class="card"><h2>Marque</h2><div class="grid-2">
      ${field("Nom complet", "brand.name", b.name)}
      ${field("Nom court", "brand.shortName", b.shortName)}
      ${field("Signature", "brand.tagline", b.tagline)}
      ${field("Téléphone cliquable", "brand.phone", b.phone)}
      ${field("Téléphone affiché", "brand.phoneDisplay", b.phoneDisplay)}
      ${field("Instagram", "brand.instagram", b.instagram)}
      ${field("Courriel", "brand.email", b.email, "email")}
      ${field("Logo (URL ou /logo.png)", "brand.logoUrl", b.logoUrl)}
    </div></section>
    <section class="card"><h2>Menu</h2><div class="grid-3">
      ${field("Atelier", "nav.about", n.about)}
      ${field("Soins", "nav.services", n.services)}
      ${field("Secteurs", "nav.zones", n.zones)}
      ${field("Galerie", "nav.gallery", n.gallery)}
      ${field("Avis", "nav.testimonials", n.testimonials)}
      ${field("Bouton réserver", "nav.booking", n.booking)}
    </div></section>
    <section class="card"><h2>Référencement</h2>
      ${field("Titre de la page", "seo.title", state.content.seo.title)}
      ${area("Description", "seo.description", state.content.seo.description)}
    </section>
    <section class="card"><h2>Pied de page</h2>
      ${area("Texte", "footer.blurb", state.content.footer.blurb)}
      ${field("Ligne du bas", "footer.note", state.content.footer.note)}
    </section>`;
	}

	function renderHero() {
		const h = state.content.hero;
		return `<section class="card"><h2>Accueil</h2><div class="grid-2">
      ${field("Sur-titre", "hero.kicker", h.kicker)}
      ${field("Titre", "hero.title", h.title)}
      ${field("Titre en dégradé", "hero.highlight", h.highlight)}
      ${field("Bouton principal", "hero.primaryCta", h.primaryCta)}
      ${field("Bouton secondaire", "hero.secondaryCta", h.secondaryCta)}
      <div class="span-2">${area("Texte", "hero.subtitle", h.subtitle)}</div>
      <div class="span-2">${field("Note sous les boutons", "hero.note", h.note)}</div>
      <div class="span-2">${area("Bande défilante, une phrase par ligne", "marquee", state.content.marquee.join("\n"))}</div>
    </div></section>
    <section class="card"><h2>Chiffres</h2>
      ${state.content.stats.map((item) => `<article class="editor"><header><h3>${esc(item.value)}</h3>${actions("stats", item.id)}</header><div class="grid-2">${inputItem("stats", item.id, "value", "Valeur", item.value)}${inputItem("stats", item.id, "label", "Libellé", item.label)}</div></article>`).join("")}
      ${addButton("stats", "Ajouter un chiffre")}
    </section>
    <section class="card"><h2>Citation</h2>
      ${area("Texte", "quote.text", state.content.quote.text)}
      ${field("Signature", "quote.by", state.content.quote.by)}
    </section>
    <section class="card"><h2>Atelier</h2>
      ${field("Sur-titre", "about.kicker", state.content.about.kicker)}
      ${field("Titre", "about.title", state.content.about.title)}
      ${area("Texte", "about.text", state.content.about.text)}
      ${state.content.about.points.map((item) => `<article class="editor"><header><h3>${esc(item.title)}</h3>${actions("points", item.id)}</header>${inputItem("points", item.id, "title", "Titre", item.title)}${areaItem("points", item.id, "text", "Texte", item.text)}</article>`).join("")}
      ${addButton("points", "Ajouter un point")}
    </section>`;
	}

	function renderStructure() {
		return `<section class="card"><h2>Sections visibles</h2>
      <p class="hint">Décochez pour masquer une section. L'ordre est celui de la page, sous l'accueil.</p>
      <ol class="structure">
        ${state.content.sectionOrder.map((id) => `<li>
          <label class="check"><input data-bind="sections.${id}" type="checkbox" ${state.content.sections[id] ? "checked" : ""} /><span>${esc(SECTION_LABELS[id] || id)}</span></label>
          <div class="row-actions">
            <button type="button" data-action="section-move" data-id="${id}" data-dir="-1">Monter</button>
            <button type="button" data-action="section-move" data-id="${id}" data-dir="1">Descendre</button>
          </div>
        </li>`).join("")}
      </ol>
    </section>`;
	}

	function renderServices() {
		const intro = state.content.servicesIntro;
		return `<section class="card"><h2>Introduction</h2>
      ${field("Sur-titre", "servicesIntro.kicker", intro.kicker)}
      ${field("Titre", "servicesIntro.title", intro.title)}
      ${area("Texte", "servicesIntro.text", intro.text)}
    </section>
    ${state.content.services.map((item) => `<article class="editor"><header><h3>${esc(item.name)}</h3>${actions("services", item.id)}</header><div class="grid-2">
      ${inputItem("services", item.id, "name", "Nom", item.name)}
      ${inputItem("services", item.id, "category", "Catégorie", item.category)}
      ${inputItem("services", item.id, "price", "Prix affiché", item.price)}
      ${inputItem("services", item.id, "duration", "Durée", item.duration)}
      <label class="f">Disponibilité ${avail("services", item.id, item.availability)}</label>
      <label class="check"><input data-list="services" data-id="${esc(item.id)}" data-field="featured" type="checkbox" ${item.featured ? "checked" : ""} /><span>Mettre en signature</span></label>
      <div class="span-2">${areaItem("services", item.id, "description", "Description", item.description)}</div>
    </div></article>`).join("")}
    ${addButton("services", "Ajouter un soin")}`;
	}

	function renderZones() {
		const intro = state.content.zonesIntro;
		return `<section class="card"><h2>Introduction</h2>
      ${field("Sur-titre", "zonesIntro.kicker", intro.kicker)}
      ${field("Titre", "zonesIntro.title", intro.title)}
      ${area("Texte", "zonesIntro.text", intro.text)}
    </section>
    ${state.content.zones.map((item) => `<article class="editor"><header><h3>${esc(item.name)}</h3>${actions("zones", item.id)}</header><div class="grid-2">
      ${inputItem("zones", item.id, "name", "Secteur", item.name)}
      ${inputItem("zones", item.id, "area", "Région", item.area)}
      <label class="f span-2">Disponibilité ${avail("zones", item.id, item.availability)}</label>
      <div class="span-2">${areaItem("zones", item.id, "description", "Description", item.description)}</div>
    </div></article>`).join("")}
    ${addButton("zones", "Ajouter un secteur")}`;
	}

	function renderHours() {
		const intro = state.content.hoursIntro;
		return `<section class="card"><h2>Horaires</h2>
      ${field("Sur-titre", "hoursIntro.kicker", intro.kicker)}
      ${field("Titre", "hoursIntro.title", intro.title)}
      ${area("Note", "hoursIntro.note", intro.note)}
    </section>
    ${state.content.hours.map((item) => `<article class="editor"><header><h3>${esc(item.day)}</h3>${actions("hours", item.id)}</header><div class="grid-2">
      ${inputItem("hours", item.id, "day", "Jour", item.day)}
      ${inputItem("hours", item.id, "hours", "Heures", item.hours)}
      <label class="check"><input data-list="hours" data-id="${esc(item.id)}" data-field="closed" type="checkbox" ${item.closed ? "checked" : ""} /><span>Fermé</span></label>
    </div></article>`).join("")}
    ${addButton("hours", "Ajouter une ligne")}`;
	}

	function renderSteps() {
		const intro = state.content.stepsIntro;
		return `<section class="card"><h2>Démarche</h2>
      ${field("Sur-titre", "stepsIntro.kicker", intro.kicker)}
      ${field("Titre", "stepsIntro.title", intro.title)}
      ${area("Texte", "stepsIntro.text", intro.text)}
    </section>
    ${state.content.steps.map((item) => `<article class="editor"><header><h3>${esc(item.title)}</h3>${actions("steps", item.id)}</header>
      ${inputItem("steps", item.id, "title", "Titre", item.title)}
      ${areaItem("steps", item.id, "text", "Texte", item.text)}
    </article>`).join("")}
    ${addButton("steps", "Ajouter une étape")}`;
	}

	function renderGallery() {
		const intro = state.content.galleryIntro;
		return `<section class="card"><h2>Galerie</h2>
      <p class="hint">Sans image, un visuel animé est généré. Vous pouvez coller l'adresse d'une photo.</p>
      ${field("Sur-titre", "galleryIntro.kicker", intro.kicker)}
      ${field("Titre", "galleryIntro.title", intro.title)}
      ${area("Texte", "galleryIntro.text", intro.text)}
    </section>
    ${state.content.gallery.map((item) => `<article class="editor"><header><h3>${esc(item.title)}</h3>${actions("gallery", item.id)}</header><div class="grid-2">
      ${inputItem("gallery", item.id, "title", "Titre", item.title)}
      ${inputItem("gallery", item.id, "caption", "Légende", item.caption)}
      <div class="span-2">${inputItem("gallery", item.id, "imageUrl", "Image (https://…)", item.imageUrl, "url")}</div>
      <label class="f">Style <select data-list="gallery" data-id="${esc(item.id)}" data-field="motif">${options(item.motif, MOTIFS)}</select></label>
      <label class="check"><input data-list="gallery" data-id="${esc(item.id)}" data-field="visible" type="checkbox" ${item.visible ? "checked" : ""} /><span>Visible sur le site</span></label>
    </div></article>`).join("")}
    ${addButton("gallery", "Ajouter un visuel")}`;
	}

	function renderReviews() {
		const intro = state.content.testimonialsIntro;
		return `<section class="card"><h2>Avis</h2>
      <p class="hint">Les textes déjà en place sont des exemples. Remplacez-les par de vrais commentaires, ou masquez-les.</p>
      ${field("Sur-titre", "testimonialsIntro.kicker", intro.kicker)}
      ${field("Titre", "testimonialsIntro.title", intro.title)}
      ${area("Texte", "testimonialsIntro.text", intro.text)}
    </section>
    ${state.content.testimonials.map((item) => `<article class="editor"><header><h3>${esc(item.name)}</h3>${actions("testimonials", item.id)}</header><div class="grid-2">
      ${inputItem("testimonials", item.id, "name", "Nom", item.name)}
      ${inputItem("testimonials", item.id, "area", "Secteur", item.area)}
      <label class="f">Étoiles <input data-list="testimonials" data-id="${esc(item.id)}" data-field="stars" data-kind="int" type="number" min="1" max="5" value="${esc(item.stars)}" /></label>
      <label class="check"><input data-list="testimonials" data-id="${esc(item.id)}" data-field="visible" type="checkbox" ${item.visible ? "checked" : ""} /><span>Visible</span></label>
      <div class="span-2">${areaItem("testimonials", item.id, "text", "Commentaire", item.text)}</div>
    </div></article>`).join("")}
    ${addButton("testimonials", "Ajouter un avis")}`;
	}

	function renderFaq() {
		const intro = state.content.faqIntro;
		return `<section class="card"><h2>Questions</h2>
      ${field("Sur-titre", "faqIntro.kicker", intro.kicker)}
      ${field("Titre", "faqIntro.title", intro.title)}
    </section>
    ${state.content.faq.map((item) => `<article class="editor"><header><h3>${esc(item.question)}</h3>${actions("faq", item.id)}</header>
      ${inputItem("faq", item.id, "question", "Question", item.question)}
      ${areaItem("faq", item.id, "answer", "Réponse", item.answer)}
    </article>`).join("")}
    ${addButton("faq", "Ajouter une question")}`;
	}

	function renderBookingSettings() {
		const b = state.content.booking;
		return `<section class="card"><h2>Formulaire</h2>
      ${check("Formulaire en ligne actif", "booking.enabled", b.enabled)}
      ${field("Sur-titre", "booking.kicker", b.kicker)}
      ${field("Titre", "booking.title", b.title)}
      ${area("Texte", "booking.text", b.text)}
      ${field("Bouton", "booking.submitLabel", b.submitLabel)}
      ${field("Titre de confirmation", "booking.successTitle", b.successTitle)}
      ${area("Texte de confirmation", "booking.successText", b.successText)}
      ${area("Message si le formulaire est en pause", "booking.pauseMessage", b.pauseMessage)}
      ${area("Note sous le bouton", "booking.disclaimer", b.disclaimer)}
      <div class="grid-2">
        ${field("Libellé nom", "booking.labels.name", b.labels.name)}
        ${field("Libellé téléphone", "booking.labels.phone", b.labels.phone)}
        ${field("Libellé courriel", "booking.labels.email", b.labels.email)}
        ${field("Libellé soin", "booking.labels.service", b.labels.service)}
        ${field("Libellé secteur", "booking.labels.zone", b.labels.zone)}
        ${field("Libellé date", "booking.labels.date", b.labels.date)}
        ${field("Libellé message", "booking.labels.message", b.labels.message)}
      </div>
    </section>`;
	}

	function when(iso) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return iso || "";
		return date.toLocaleString("fr-CA", { timeZone: "America/Toronto", dateStyle: "medium", timeStyle: "short" });
	}

	function renderBookings() {
		if (!state.bookings.length) {
			return `<section class="card"><h2>Demandes</h2><p class="hint">Aucune demande pour le moment. Elles arriveront ici dès qu'un visiteur enverra le formulaire.</p></section>`;
		}
		return `<section class="card"><h2>Demandes</h2>
      ${state.bookings.map((item) => `<article class="demand">
        <div class="inline">
          <strong>${esc(item.name)}</strong>
          <select data-booking="${item.id}">${options(item.status, STATUSES)}</select>
          <button type="button" class="danger" data-action="booking-delete" data-id="${item.id}">Supprimer</button>
        </div>
        <div class="meta">${esc(when(item.created_at))} · ${esc(item.service)} · ${esc(item.zone)}${item.preferred_date ? ` · ${esc(item.preferred_date)}` : ""}</div>
        <a href="tel:${esc(item.phone.replace(/[^\d+]/g, ""))}">${esc(item.phone)}</a>
        ${item.email ? `<a href="mailto:${esc(item.email)}">${esc(item.email)}</a>` : ""}
        ${item.message ? `<p>${esc(item.message)}</p>` : ""}
      </article>`).join("")}
    </section>`;
	}

	function renderAccount() {
		return `<section class="card"><h2>Mot de passe</h2>
      <form id="password-form" class="grid-2">
        <label class="f">Mot de passe actuel<input name="current" type="password" autocomplete="current-password" required /></label>
        <label class="f">Nouveau mot de passe<input name="next" type="password" minlength="8" autocomplete="new-password" required /></label>
        <button class="primary" type="submit">Mettre à jour</button>
      </form>
    </section>
    <section class="card"><h2>Copie du contenu</h2>
      <p class="hint">Téléchargez une copie, ou rechargez un fichier exporté. Il faut enregistrer ensuite pour publier.</p>
      <div class="inline">
        <button type="button" class="ghost" data-action="export">Télécharger le JSON</button>
        <label class="ghost">Importer<input id="import-file" class="visually-hidden" type="file" accept="application/json,.json" /></label>
      </div>
    </section>
    <section class="card"><h2>Réinitialiser</h2>
      <p class="hint">Remplace tous les textes par le contenu d'origine de La Coche. Les demandes de rendez-vous restent.</p>
      <button type="button" class="danger" data-action="reset">Revenir au contenu d'origine</button>
    </section>`;
	}

	async function api(url, options = {}) {
		const response = await fetch(url, options);
		if (response.status === 401 && !url.endsWith("/login")) {
			showLogin();
			throw new Error("Session expirée.");
		}
		return response;
	}

	function showLogin() {
		document.getElementById("app").hidden = true;
		document.getElementById("login").hidden = false;
	}

	async function enter() {
		const [contentRes, bookingRes, sessionRes] = await Promise.all([
			fetch("/api/admin/content"),
			fetch("/api/admin/bookings"),
			fetch("/api/admin/session"),
		]);
		if (!contentRes.ok) {
			showLogin();
			return;
		}
		state.content = await contentRes.json();
		state.bookings = bookingRes.ok ? await bookingRes.json() : [];
		if (sessionRes.ok) state.passwordChanged = !!(await sessionRes.json()).passwordChanged;
		state.dirty = false;
		state.mode = "server";
		openApp();
	}

	function flushMarquee() {
		const node = document.querySelector("[data-bind='marquee']");
		if (!node) return;
		state.content.marquee = node.value.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 24);
	}

	function openApp() {
		document.getElementById("login").hidden = true;
		document.getElementById("app").hidden = false;
		if (state.mode === "file") {
			const brand = document.querySelector(".side-brand");
			if (brand) brand.setAttribute("href", "la-coche-site.html");
		}
		renderNav();
		render();
		updateSave();
		showBanner();
	}

	function offlineLogin(password) {
		const error = document.getElementById("login-error");
		if (!defaultContent()) {
			error.hidden = false;
			error.textContent = "Ce fichier est incomplet. Télécharge la page admin à jour.";
			return;
		}
		if (password !== currentPassword()) {
			error.hidden = false;
			error.textContent = "Mot de passe incorrect.";
			return;
		}
		state.mode = "file";
		state.content = readStore("lc_offline_content") || defaultContent();
		state.bookings = readStore("lc_offline_bookings") || [];
		state.passwordChanged = currentPassword() !== DEFAULT_PASSWORD;
		state.dirty = false;
		openApp();
		toast("Connecté.");
	}

	async function saveOffline() {
		flushMarquee();
		const button = document.getElementById("save-btn");
		button.disabled = true;
		document.getElementById("save-label").textContent = "Préparation du fichier…";
		try {
			const kept = persistOffline();
			const html = buildSiteHtml(state.content);
			if (!html || !html.includes("<style>")) {
				throw new Error("Le fichier du site n'a pas pu être préparé.");
			}
			downloadText("la-coche-site.html", html, "text/html");
			state.dirty = false;
			toast(kept ? "Site téléchargé. Remplace l'ancien fichier." : "Site téléchargé. Ce navigateur ne garde pas les changements dans la page admin.");
			render();
		} catch (error) {
			toast(error.message || "Téléchargement impossible.");
		}
		updateSave();
	}

	async function save() {
		if (!state.content) return;
		if (state.mode === "file") return saveOffline();
		flushMarquee();
		const button = document.getElementById("save-btn");
		button.disabled = true;
		document.getElementById("save-label").textContent = "Enregistrement…";
		try {
			const response = await api("/api/admin/content", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(state.content),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
			state.content = data;
			state.dirty = false;
			toast("Enregistré. Le site est à jour.");
			render();
		} catch (error) {
			toast(error.message || "Enregistrement impossible.");
		}
		updateSave();
	}

	async function loadBookings() {
		const response = await api("/api/admin/bookings");
		if (response.ok) state.bookings = await response.json();
	}

	document.getElementById("login-form").addEventListener("submit", async (event) => {
		event.preventDefault();
		const error = document.getElementById("login-error");
		error.hidden = true;
		const password = String(new FormData(event.target).get("password") || "");
		try {
			const response = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ password }),
			});
			const data = await response.json().catch(() => null);
			if (response.ok && data) {
				state.mode = "server";
				state.passwordChanged = !!data.passwordChanged;
				await enter();
				return;
			}
			if (response.status === 401 || response.status === 429) {
				error.hidden = false;
				error.textContent = (data && data.error) || "Mot de passe incorrect.";
				return;
			}
			offlineLogin(password);
		} catch {
			offlineLogin(password);
		}
	});

	document.getElementById("tabs").addEventListener("click", (event) => {
		const button = event.target.closest("[data-tab]");
		if (!button) return;
		state.tab = button.dataset.tab;
		render();
	});
	document.getElementById("tab-select").addEventListener("change", (event) => {
		state.tab = event.target.value;
		render();
	});
	document.getElementById("save-btn").addEventListener("click", () => save());

	document.getElementById("view").addEventListener("input", onEdit);
	document.getElementById("view").addEventListener("change", onEdit);
	document.getElementById("view").addEventListener("click", onClick);
	document.getElementById("view").addEventListener("submit", onSubmit);

	function onEdit(event) {
		const target = event.target;
		if (target.id === "import-file") return;
		if (target.dataset.booking) {
			if (event.type === "change") updateBooking(target.dataset.booking, target.value);
			return;
		}
		if (target.dataset.bind) {
			let value = target.type === "checkbox" ? target.checked : target.value;
			if (target.dataset.bind === "marquee") {
				value = String(target.value).split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 24);
			}
			setPath(target.dataset.bind, value);
			return;
		}
		if (target.dataset.list && target.dataset.id && target.dataset.field) {
			const item = listOf(target.dataset.list).find((entry) => entry.id === target.dataset.id);
			if (!item) return;
			item[target.dataset.field] = target.dataset.kind === "int" ? Number(target.value) : target.type === "checkbox" ? target.checked : target.value;
			state.dirty = true;
			updateSave();
		}
	}

	function onClick(event) {
		const button = event.target.closest("[data-action]");
		if (!button) return;
		const action = button.dataset.action;
		if (action === "goto") {
			state.tab = button.dataset.tab;
			render();
			return;
		}
		if (action === "status") {
			state.content.status.state = button.dataset.value;
			state.dirty = true;
			updateSave();
			render();
			return;
		}
		if (action === "add" && blank[button.dataset.list]) {
			listOf(button.dataset.list).push(blank[button.dataset.list]());
			state.dirty = true;
			updateSave();
			render();
			return;
		}
		if (action === "remove") {
			const list = listOf(button.dataset.list);
			const index = list.findIndex((item) => item.id === button.dataset.id);
			if (index >= 0) list.splice(index, 1);
			state.dirty = true;
			updateSave();
			render();
			return;
		}
		if (action === "move") {
			const list = listOf(button.dataset.list);
			const index = list.findIndex((item) => item.id === button.dataset.id);
			const next = index + Number(button.dataset.dir);
			if (index < 0 || next < 0 || next >= list.length) return;
			const [item] = list.splice(index, 1);
			list.splice(next, 0, item);
			state.dirty = true;
			updateSave();
			render();
			return;
		}
		if (action === "section-move") {
			const order = state.content.sectionOrder;
			const index = order.indexOf(button.dataset.id);
			const next = index + Number(button.dataset.dir);
			if (index < 0 || next < 0 || next >= order.length) return;
			const [item] = order.splice(index, 1);
			order.splice(next, 0, item);
			state.dirty = true;
			updateSave();
			render();
			return;
		}
		if (action === "export") {
			const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: "application/json" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download = "la-coche-contenu.json";
			link.click();
			URL.revokeObjectURL(link.href);
			return;
		}
		if (action === "booking-delete") {
			if (!confirm("Supprimer cette demande?")) return;
			removeBooking(button.dataset.id);
			return;
		}
		if (action === "reset") {
			if (!confirm("Revenir au contenu d'origine? Cette action remplace les textes du site.")) return;
			resetContent();
		}
	}

	async function onSubmit(event) {
		if (event.target.id !== "password-form") return;
		event.preventDefault();
		const data = Object.fromEntries(new FormData(event.target).entries());
		if (state.mode === "file") {
			if (data.current !== currentPassword()) {
				toast("Mot de passe actuel incorrect.");
				return;
			}
			if (String(data.next || "").length < 8) {
				toast("Le nouveau mot de passe doit faire au moins 8 caractères.");
				return;
			}
			memoryPassword = String(data.next);
			writeStore("lc_offline_password", memoryPassword);
			state.passwordChanged = memoryPassword !== DEFAULT_PASSWORD;
			showBanner();
			event.target.reset();
			toast("Mot de passe mis à jour pour ce fichier.");
			return;
		}
		try {
			const response = await api("/api/admin/password", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(data),
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || "Changement impossible.");
			state.passwordChanged = true;
			showBanner();
			event.target.reset();
			toast("Mot de passe mis à jour.");
		} catch (error) {
			toast(error.message || "Changement impossible.");
		}
	}

	document.getElementById("view").addEventListener("change", async (event) => {
		const input = event.target;
		if (input.id !== "import-file" || !input.files?.[0]) return;
		try {
			const text = await input.files[0].text();
			const data = JSON.parse(text);
			if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Fichier invalide.");
			if (state.mode === "file") {
				state.content = typeof globalThis.normalizeLaCoche === "function" ? globalThis.normalizeLaCoche(data) : data;
				state.dirty = true;
				updateSave();
				render();
				toast("Fichier chargé. Enregistrez pour télécharger le site.");
				input.value = "";
				return;
			}
			const response = await api("/api/admin/normalize", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(data),
			});
			const normalized = await response.json().catch(() => null);
			if (!response.ok || !normalized) throw new Error("Fichier invalide.");
			state.content = normalized;
			state.dirty = true;
			updateSave();
			render();
			toast("Fichier chargé. Enregistrez pour le publier.");
		} catch (error) {
			toast(error.message || "Fichier illisible.");
		}
		input.value = "";
	});

	async function updateBooking(id, status) {
		if (state.mode === "file") {
			const item = state.bookings.find((row) => String(row.id) === String(id));
			if (item) item.status = status;
			persistOffline();
			render();
			toast("Demande mise à jour.");
			return;
		}
		try {
			const response = await api(`/api/admin/bookings/${id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ status }),
			});
			if (!response.ok) throw new Error("Statut non mis à jour.");
			await loadBookings();
			render();
			toast("Demande mise à jour.");
		} catch (error) {
			toast(error.message || "Statut non mis à jour.");
		}
	}

	async function removeBooking(id) {
		if (state.mode === "file") {
			state.bookings = state.bookings.filter((row) => String(row.id) !== String(id));
			persistOffline();
			render();
			toast("Demande supprimée.");
			return;
		}
		try {
			const response = await api(`/api/admin/bookings/${id}`, { method: "DELETE" });
			if (!response.ok) throw new Error("Suppression impossible.");
			await loadBookings();
			render();
			toast("Demande supprimée.");
		} catch (error) {
			toast(error.message || "Suppression impossible.");
		}
	}

	async function resetContent() {
		if (state.mode === "file") {
			state.content = defaultContent();
			state.dirty = true;
			updateSave();
			render();
			toast("Contenu d'origine rétabli. Enregistrez pour télécharger le site.");
			return;
		}
		try {
			const response = await api("/api/admin/reset", { method: "POST" });
			const data = await response.json().catch(() => null);
			if (!response.ok || !data) throw new Error("Réinitialisation impossible.");
			state.content = data;
			state.dirty = false;
			updateSave();
			render();
			toast("Contenu d'origine rétabli.");
		} catch (error) {
			toast(error.message || "Réinitialisation impossible.");
		}
	}

	document.addEventListener("keydown", (event) => {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
			event.preventDefault();
			if (state.content) save();
		}
	});
	window.addEventListener("beforeunload", (event) => {
		if (!state.dirty) return;
		event.preventDefault();
		event.returnValue = "";
	});

	fetch("/api/admin/session")
		.then((response) => {
			if (response.ok) enter();
		})
		.catch(() => {});
})();
