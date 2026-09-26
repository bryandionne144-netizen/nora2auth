import type { GalleryItem, SectionId, ServiceItem, SiteContent, Testimonial, ZoneItem } from "./content";
import { esc, instagramHref, jsonForScript, rich, telHref, todayInToronto } from "./util";

const STATUS_LABEL: Record<SiteContent["status"]["state"], string> = {
	ouvert: "Ouvert",
	complet: "Complet",
	ferme: "Fermé",
};

function todayName(): string {
	return new Intl.DateTimeFormat("fr-CA", {
		weekday: "long",
		timeZone: "America/Toronto",
	})
		.format(new Date())
		.toLowerCase();
}

function featuredService(content: SiteContent): ServiceItem | undefined {
	return (
		content.services.find((item) => item.featured && item.availability === "disponible") ||
		content.services.find((item) => item.availability === "disponible")
	);
}

export function renderPublic(content: SiteContent, requestUrl: URL): string {
	const phoneLink = telHref(content.brand.phone || content.brand.phoneDisplay);
	const instagram = instagramHref(content.brand.instagram);
	const logo = content.brand.logoUrl || "/logo.png";
	const origin = requestUrl.origin;
	const visible = new Set(content.sectionOrder.filter((id) => content.sections[id]));
	const sections = content.sectionOrder
		.filter((id) => visible.has(id))
		.map((id) => renderSection(id, content, phoneLink))
		.join("\n");
	const feature = featuredService(content);
	const nav = [
		["about", "atelier", content.nav.about],
		["services", "soins", content.nav.services],
		["zones", "secteurs", content.nav.zones],
		["gallery", "galerie", content.nav.gallery],
		["testimonials", "avis", content.nav.testimonials],
	].filter(([id]) => visible.has(id as SectionId));
	const bookingHref = visible.has("booking") ? "#reservation" : phoneLink || "#";
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "AutoWash",
		name: content.brand.name,
		telephone: content.brand.phone,
		url: origin,
		image: new URL(logo, origin).toString(),
		areaServed: content.zones.map((zone) => zone.name),
		sameAs: instagram ? [instagram] : [],
		description: content.seo.description,
	};

	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>document.documentElement.classList.add("js")</script>
  <title>${esc(content.seo.title)}</title>
  <meta name="description" content="${esc(content.seo.description)}" />
  <meta name="theme-color" content="#05070c" />
  <link rel="canonical" href="${esc(origin)}/" />
  <meta property="og:title" content="${esc(content.seo.title)}" />
  <meta property="og:description" content="${esc(content.seo.description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="fr_CA" />
  <meta property="og:url" content="${esc(origin)}/" />
  <meta property="og:image" content="${esc(new URL(logo, origin).toString())}" />
  <link rel="icon" href="${esc(logo)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/site.css" />
  <script type="application/ld+json">${jsonForScript(jsonLd)}</script>
</head>
<body>
  <div class="progress" aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="grid-bg" aria-hidden="true"></div>
  ${
		content.announcement.enabled
			? `<div class="announce"><p>${esc(content.announcement.text)}</p></div>`
			: ""
	}
  <header class="nav">
    <div class="nav-inner">
      <a class="brand" href="#haut">
        <img src="${esc(logo)}" alt="" />
        <span>
          <strong>${esc(content.brand.shortName)}</strong>
          <em>${esc(content.brand.tagline)}</em>
        </span>
      </a>
      <nav class="nav-links" id="nav-links">
        ${nav.map(([, href, label]) => `<a href="#${href}">${esc(label)}</a>`).join("")}
      </nav>
      <div class="nav-end">
        ${
					phoneLink
						? `<a class="nav-phone" href="${esc(phoneLink)}">${esc(content.brand.phoneDisplay)}</a>`
						: ""
				}
        <a class="btn btn-primary nav-book" href="${esc(bookingHref)}">${esc(content.nav.booking)}</a>
        <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <main id="haut">
    <section class="hero">
      <div class="hero-copy">
        <p class="status status-${content.status.state}"><i></i><span>${esc(STATUS_LABEL[content.status.state])}</span> ${esc(content.status.message)}</p>
        <p class="kicker">${esc(content.hero.kicker)}</p>
        <h1><span class="line">${esc(content.hero.title)}</span>${content.hero.highlight ? `<span class="line grad">${esc(content.hero.highlight)}</span>` : ""}</h1>
        ${content.hero.subtitle ? `<p class="lede">${esc(content.hero.subtitle)}</p>` : ""}
        <div class="hero-actions">
          <a class="btn btn-primary" href="${esc(bookingHref)}">${esc(content.hero.primaryCta)}</a>
          ${
						visible.has("services")
							? `<a class="btn btn-ghost" href="#soins">${esc(content.hero.secondaryCta)}</a>`
							: ""
					}
        </div>
        ${content.hero.note ? `<p class="hero-note">${esc(content.hero.note)}</p>` : ""}
        <ul class="hero-meta">
          ${phoneLink ? `<li><a href="${esc(phoneLink)}">${esc(content.brand.phoneDisplay)}</a></li>` : ""}
          ${instagram ? `<li><a href="${esc(instagram)}" target="_blank" rel="noreferrer">${esc(content.brand.instagram)}</a></li>` : ""}
          ${content.brand.email ? `<li><a href="mailto:${esc(content.brand.email)}">${esc(content.brand.email)}</a></li>` : ""}
        </ul>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="orb">
          <span class="ring r1"></span>
          <span class="ring r2"></span>
          <span class="ring r3"></span>
          <img src="${esc(logo)}" alt="" />
          <span class="drop d1"></span>
          <span class="drop d2"></span>
          <span class="drop d3"></span>
          <span class="drop d4"></span>
        </div>
        ${
					feature
						? `<aside class="float-card">
              <span>${feature.featured ? "Signature" : "Disponible"}</span>
              <strong>${esc(feature.name)}</strong>
              <em>${esc(feature.price)}${feature.duration ? ` · ${esc(feature.duration)}` : ""}</em>
            </aside>`
						: ""
				}
      </div>
    </section>

    ${
			content.marquee.length
				? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1]
						.map(
							() =>
								`<div class="marquee-group">${content.marquee
									.map((item) => `<span>${esc(item)}</span><i></i>`)
									.join("")}</div>`,
						)
						.join("")}</div></div>`
				: ""
		}

    ${
			content.stats.length
				? `<section class="stats-wrap"><div class="container stats">${content.stats
						.map(
							(item, index) =>
								`<article class="reveal" style="--d:${index * 70}ms"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></article>`,
						)
						.join("")}</div></section>`
				: ""
		}

    ${sections}
  </main>

  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <a class="brand footer-brand" href="#haut">
          <img src="${esc(logo)}" alt="" />
          <span><strong>${esc(content.brand.name)}</strong><em>${esc(content.brand.tagline)}</em></span>
        </a>
        <p>${esc(content.footer.blurb)}</p>
      </div>
      <div>
        <h2>Contact</h2>
        ${phoneLink ? `<a href="${esc(phoneLink)}">${esc(content.brand.phoneDisplay)}</a>` : ""}
        ${instagram ? `<a href="${esc(instagram)}" target="_blank" rel="noreferrer">${esc(content.brand.instagram)}</a>` : ""}
        ${content.brand.email ? `<a href="mailto:${esc(content.brand.email)}">${esc(content.brand.email)}</a>` : ""}
      </div>
      <div>
        <h2>Secteurs</h2>
        ${content.zones
					.map(
						(zone) =>
							`<p>${esc(zone.name)}${zone.availability === "indisponible" ? " · indisponible" : ""}</p>`,
					)
					.join("")}
      </div>
      <div>
        <h2>Horaires</h2>
        ${content.hours
					.map((hour) => `<p>${esc(hour.day)} · ${esc(hour.closed ? "Fermé" : hour.hours)}</p>`)
					.join("")}
      </div>
    </div>
    <div class="container footer-bar">
      <p>${esc(content.footer.note)}</p>
      <a href="/admin">Espace pro</a>
    </div>
  </footer>
  ${
		phoneLink
			? `<a class="call-fab" href="${esc(phoneLink)}">Appeler<span>${esc(content.brand.phoneDisplay)}</span></a>`
			: ""
	}
  <script src="/site.js"></script>
  <script>
    setTimeout(function () {
      if (document.documentElement.dataset.motion) return;
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }, 1600);
  </script>
</body>
</html>`;
}

function renderSection(id: SectionId, content: SiteContent, phoneLink: string): string {
	switch (id) {
		case "about":
			return renderAbout(content);
		case "services":
			return renderServices(content);
		case "zones":
			return renderZones(content);
		case "steps":
			return renderSteps(content);
		case "gallery":
			return renderGallery(content);
		case "quote":
			return renderQuote(content);
		case "testimonials":
			return renderTestimonials(content);
		case "hours":
			return renderHours(content);
		case "faq":
			return renderFaq(content);
		case "booking":
			return renderBooking(content, phoneLink);
		default:
			return "";
	}
}

function head(kicker: string, title: string, text = ""): string {
	return `<div class="section-head reveal">
    <p class="kicker">${esc(kicker)}</p>
    <h2>${esc(title)}</h2>
    ${text ? `<p>${esc(text)}</p>` : ""}
  </div>`;
}

function renderAbout(content: SiteContent): string {
	return `<section class="section" id="atelier">
    <div class="container about-grid">
      <div>
        ${head(content.about.kicker, content.about.title, content.about.text)}
      </div>
      <div class="points">
        ${content.about.points
					.map(
						(point, index) => `<article class="reveal" style="--d:${index * 70}ms">
            <span>0${index + 1}</span>
            <h3>${esc(point.title)}</h3>
            <p>${rich(point.text)}</p>
          </article>`,
					)
					.join("")}
      </div>
    </div>
  </section>`;
}

function renderServices(content: SiteContent): string {
	const categories = [...new Set(content.services.map((item) => item.category).filter(Boolean))];
	return `<section class="section" id="soins">
    <div class="container">
      ${head(content.servicesIntro.kicker, content.servicesIntro.title, content.servicesIntro.text)}
      ${
				categories.length > 1
					? `<div class="filters" role="tablist">${["Tout", ...categories]
							.map(
								(category, index) =>
									`<button type="button" class="chip${index === 0 ? " on" : ""}" data-filter="${index === 0 ? "all" : esc(category)}">${esc(category)}</button>`,
							)
							.join("")}</div>`
					: ""
			}
      <div class="service-grid">
        ${content.services.map((service, index) => serviceCard(service, index)).join("")}
      </div>
    </div>
  </section>`;
}

function serviceCard(service: ServiceItem, index: number): string {
	const off = service.availability !== "disponible";
	return `<article class="service reveal${service.featured ? " featured" : ""}${off ? " off" : ""}" data-category="${esc(service.category)}" style="--d:${(index % 3) * 80}ms">
    <div class="service-top">
      <span class="cat">${esc(service.category)}</span>
      <span class="pill ${off ? "bad" : "ok"}">${off ? "Indisponible" : "Disponible"}</span>
    </div>
    ${service.featured ? `<span class="signature">Signature</span>` : ""}
    <h3>${esc(service.name)}</h3>
    <p>${rich(service.description)}</p>
    <div class="service-foot">
      <strong>${esc(service.price)}</strong>
      ${service.duration ? `<span>${esc(service.duration)}</span>` : ""}
    </div>
  </article>`;
}

function renderZones(content: SiteContent): string {
	return `<section class="section" id="secteurs">
    <div class="container">
      ${head(content.zonesIntro.kicker, content.zonesIntro.title, content.zonesIntro.text)}
      <div class="zone-grid">
        ${content.zones.map((zone, index) => zoneCard(zone, index)).join("")}
      </div>
    </div>
  </section>`;
}

function zoneCard(zone: ZoneItem, index: number): string {
	const off = zone.availability !== "disponible";
	return `<article class="zone reveal${off ? " off" : ""}" style="--d:${index * 80}ms">
    <span class="zone-index">${String(index + 1).padStart(2, "0")}</span>
    <h3>${esc(zone.name)}</h3>
    ${zone.area ? `<p class="zone-area">${esc(zone.area)}</p>` : ""}
    <p>${rich(zone.description)}</p>
    <span class="pill ${off ? "bad" : "ok"}">${off ? "Secteur complet" : "On s'y déplace"}</span>
  </article>`;
}

function renderSteps(content: SiteContent): string {
	return `<section class="section" id="demarche">
    <div class="container">
      ${head(content.stepsIntro.kicker, content.stepsIntro.title, content.stepsIntro.text)}
      <div class="steps">
        ${content.steps
					.map(
						(step, index) => `<article class="step reveal" style="--d:${index * 80}ms">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${esc(step.title)}</h3>
            <p>${rich(step.text)}</p>
          </article>`,
					)
					.join("")}
      </div>
    </div>
  </section>`;
}

function renderGallery(content: SiteContent): string {
	const items = content.gallery.filter((item) => item.visible);
	if (!items.length) return "";
	return `<section class="section" id="galerie">
    <div class="container">
      ${head(content.galleryIntro.kicker, content.galleryIntro.title, content.galleryIntro.text)}
      <div class="gallery">
        ${items.map((item, index) => galleryCard(item, index)).join("")}
      </div>
    </div>
  </section>`;
}

function galleryCard(item: GalleryItem, index: number): string {
	const photo = item.imageUrl
		? `<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" />`
		: `<span class="motif motif-${esc(item.motif)}"></span>`;
	return `<article class="tile reveal" style="--d:${(index % 3) * 70}ms">
    <div class="tile-visual">${photo}<span class="tile-index">${String(index + 1).padStart(2, "0")}</span></div>
    <div class="tile-copy">
      <h3>${esc(item.title)}</h3>
      ${item.caption ? `<p>${esc(item.caption)}</p>` : ""}
    </div>
  </article>`;
}

function renderQuote(content: SiteContent): string {
	return `<section class="quote-band">
    <div class="container">
      <p class="quote-mark" aria-hidden="true">“</p>
      <blockquote>${esc(content.quote.text)}</blockquote>
      <p class="quote-by">${esc(content.quote.by)}</p>
    </div>
  </section>`;
}

function renderTestimonials(content: SiteContent): string {
	const items = content.testimonials.filter((item) => item.visible && item.text);
	if (!items.length) return "";
	return `<section class="section" id="avis">
    <div class="container">
      ${head(content.testimonialsIntro.kicker, content.testimonialsIntro.title, content.testimonialsIntro.text)}
      <div class="reviews">
        ${items.map((item, index) => reviewCard(item, index)).join("")}
      </div>
    </div>
  </section>`;
}

function reviewCard(item: Testimonial, index: number): string {
	const stars = Math.max(1, Math.min(5, item.stars));
	return `<article class="review reveal" style="--d:${index * 70}ms">
    <p class="stars" aria-label="${stars} sur 5">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</p>
    <blockquote>${rich(item.text)}</blockquote>
    <p class="who"><strong>${esc(item.name)}</strong>${item.area ? `<span>${esc(item.area)}</span>` : ""}</p>
  </article>`;
}

function renderHours(content: SiteContent): string {
	const today = todayName();
	return `<section class="section" id="horaires">
    <div class="container hours-layout">
      <div>${head(content.hoursIntro.kicker, content.hoursIntro.title, content.hoursIntro.note)}</div>
      <div class="hours">
        ${content.hours
					.map((hour) => {
						const current = hour.day.toLowerCase() === today;
						return `<div class="hour${hour.closed ? " closed" : ""}${current ? " today" : ""}">
              <span>${esc(hour.day)}${current ? `<em>Aujourd'hui</em>` : ""}</span>
              <strong>${esc(hour.closed ? "Fermé" : hour.hours)}</strong>
            </div>`;
					})
					.join("")}
      </div>
    </div>
  </section>`;
}

function renderFaq(content: SiteContent): string {
	if (!content.faq.length) return "";
	return `<section class="section" id="questions">
    <div class="container faq-layout">
      <div>${head(content.faqIntro.kicker, content.faqIntro.title)}</div>
      <div class="faq">
        ${content.faq
					.map(
						(item) => `<article class="faq-item">
            <button type="button" aria-expanded="false">
              <span>${esc(item.question)}</span>
              <i aria-hidden="true"></i>
            </button>
            <div class="faq-a"><div><p>${rich(item.answer)}</p></div></div>
          </article>`,
					)
					.join("")}
      </div>
    </div>
  </section>`;
}

function renderBooking(content: SiteContent, phoneLink: string): string {
	const services = content.services.filter((item) => item.availability === "disponible");
	const zones = content.zones.filter((item) => item.availability === "disponible");
	const labels = content.booking.labels;
	const paused = !content.booking.enabled;
	return `<section class="section booking" id="reservation">
    <div class="container booking-grid">
      <div>
        ${head(content.booking.kicker, content.booking.title, content.booking.text)}
        <p class="status status-${content.status.state} status-inline"><i></i><span>${esc(STATUS_LABEL[content.status.state])}</span> ${esc(content.status.message)}</p>
        <div class="contact-row">
          ${phoneLink ? `<a class="btn btn-ghost" href="${esc(phoneLink)}">${esc(content.brand.phoneDisplay)}</a>` : ""}
        </div>
      </div>
      <div class="form-card">
        ${
					paused
						? `<div class="pause">${rich(content.booking.pauseMessage)}</div>`
						: `<form id="booking-form">
            <div class="hp" aria-hidden="true"><label>Société<input name="company" tabindex="-1" autocomplete="off" /></label></div>
            <div class="form-grid">
              <label class="field">${esc(labels.name)}<input name="name" required maxlength="80" autocomplete="name" /></label>
              <label class="field">${esc(labels.phone)}<input name="phone" required maxlength="24" autocomplete="tel" inputmode="tel" /></label>
              <label class="field full">${esc(labels.email)}<input name="email" type="email" maxlength="120" autocomplete="email" /></label>
              <label class="field">${esc(labels.service)}
                <select name="service" required ${services.length ? "" : "disabled"}>
                  <option value="">${services.length ? "Choisir" : "Aucun soin disponible"}</option>
                  ${services.map((item) => `<option value="${esc(item.name)}">${esc(item.name)}</option>`).join("")}
                </select>
              </label>
              <label class="field">${esc(labels.zone)}
                <select name="zone" required ${zones.length ? "" : "disabled"}>
                  <option value="">${zones.length ? "Choisir" : "Aucun secteur disponible"}</option>
                  ${zones.map((item) => `<option value="${esc(item.name)}">${esc(item.name)}</option>`).join("")}
                </select>
              </label>
              <label class="field full">${esc(labels.date)}<input name="date" type="date" min="${todayInToronto()}" /></label>
              <label class="field full">${esc(labels.message)}<textarea name="message" rows="4" maxlength="1000" placeholder="Véhicule, entrée, précisions..."></textarea></label>
            </div>
            <p class="form-error" hidden></p>
            <button class="btn btn-primary full-btn" type="submit" ${services.length && zones.length ? "" : "disabled"}>${esc(content.booking.submitLabel)}</button>
            <p class="disclaimer">${esc(content.booking.disclaimer)}</p>
          </form>
          <div id="booking-success" class="success" hidden>
            <span class="check" aria-hidden="true"></span>
            <h3>${esc(content.booking.successTitle)}</h3>
            <p>${esc(content.booking.successText)}</p>
            ${phoneLink ? `<a class="btn btn-ghost" href="${esc(phoneLink)}">Appeler ${esc(content.brand.phoneDisplay)}</a>` : ""}
          </div>`
				}
      </div>
    </div>
  </section>`;
}
