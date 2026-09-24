type Comment = {
	id?: number;
	author: string;
	content: string;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function renderNotes(comments: Comment[]): string {
	if (comments.length === 0) {
		return `<p class="notes__empty reveal">Les notes de l’atelier apparaîtront ici, dès qu’elles seront écrites.</p>`;
	}

	return comments
		.map((comment, index) => {
			const author = escapeHtml(comment.author || "Anonyme");
			const content = escapeHtml(comment.content || "");
			return `
        <article class="note reveal" style="--d:${index * 90}ms">
          <span class="note__index">0${index + 1}</span>
          <blockquote>« ${content} »</blockquote>
          <footer>
            <span class="note__mark" aria-hidden="true"></span>
            <cite>${author}</cite>
          </footer>
        </article>`;
		})
		.join("");
}

export function renderHtml(comments: Comment[] = []): string {
	const notes = renderNotes(comments);
	const year = new Date().getFullYear();

	return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Atelier Nora conçoit des sites éditoriaux sur-mesure : typographie, rythme et animations retenues pour les maisons qui veulent une présence mémorable."
    />
    <title>Atelier Nora — Sites sur-mesure</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%231a1612' width='32' height='32' rx='6'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='Georgia' font-size='16' fill='%23f3eee6'%3EN%3C/text%3E%3C/svg%3E" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,620;1,9..144,480;1,9..144,560&family=Outfit:wght@300;400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --paper: #f3eee6;
        --paper-2: #e8e1d4;
        --ink: #1a1612;
        --ink-soft: #3c342c;
        --muted: #6d645b;
        --line: rgba(26, 22, 18, 0.14);
        --copper: #9c4e2c;
        --ember: #c56a3c;
        --night: #12100e;
        --night-2: #1d1916;
        --cream: #f7f3ec;
        --gold: #a68456;
        --serif: "Fraunces", "Iowan Old Style", Palatino, Georgia, serif;
        --sans: "Outfit", "Avenir Next", "Segoe UI", sans-serif;
        --ease: cubic-bezier(0.16, 1, 0.3, 1);
      }

      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      body {
        margin: 0;
        background: var(--paper);
        color: var(--ink);
        font-family: var(--sans);
        font-weight: 400;
        font-size: 17px;
        line-height: 1.55;
        text-rendering: optimizeLegibility;
      }
      img { max-width: 100%; display: block; }
      a { color: inherit; }
      button, input, textarea { font: inherit; color: inherit; }
      ::selection { background: #e7c3a4; color: var(--ink); }

      .progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 2px;
        width: 100%;
        transform-origin: 0 50%;
        transform: scaleX(0);
        background: linear-gradient(90deg, var(--copper), var(--gold));
        z-index: 60;
      }

      .grain {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        opacity: 0.035;
        z-index: 50;
        mix-blend-mode: multiply;
      }

      .nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.1rem 4vw;
        transition: background 0.4s var(--ease), backdrop-filter 0.4s var(--ease), border-color 0.4s;
        border-bottom: 1px solid transparent;
      }
      .nav.is-stuck {
        background: rgba(243, 238, 230, 0.82);
        backdrop-filter: blur(16px);
        border-bottom-color: var(--line);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        text-decoration: none;
        letter-spacing: 0.16em;
        font-size: 0.78rem;
        font-weight: 500;
      }
      .brand__mark {
        width: 1.7rem;
        height: 1.7rem;
        border-radius: 0.4rem;
        background: var(--ink);
        color: var(--paper);
        display: grid;
        place-items: center;
        font-family: var(--serif);
        font-style: italic;
        letter-spacing: 0;
        font-size: 1rem;
      }
      .nav__links {
        display: flex;
        align-items: center;
        gap: 1.6rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .nav__links a {
        text-decoration: none;
        font-size: 0.92rem;
        color: var(--ink-soft);
        position: relative;
      }
      .nav__links a::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -0.2rem;
        width: 100%;
        height: 1px;
        background: var(--copper);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.4s var(--ease);
      }
      .nav__links a:hover::after { transform: scaleX(1); }
      .nav__meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.82rem;
        color: var(--muted);
        font-variant-numeric: tabular-nums;
      }
      .nav__toggle {
        display: none;
        background: transparent;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 0.45rem 0.9rem;
        cursor: pointer;
      }

      .hero {
        min-height: 100vh;
        padding: 8.5rem 4vw 3.5rem;
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 4vw;
        align-items: end;
      }
      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-size: 0.72rem;
        color: var(--muted);
        margin-bottom: 1.4rem;
      }
      .kicker i {
        width: 0.45rem;
        height: 0.45rem;
        border-radius: 50%;
        background: var(--ember);
        display: block;
        box-shadow: 0 0 0 0 rgba(197, 106, 60, 0.6);
        animation: pulse 2.4s ease-out infinite;
      }
      h1 {
        font-family: var(--serif);
        font-weight: 500;
        font-size: clamp(3.4rem, 7.4vw, 7.4rem);
        line-height: 0.9;
        letter-spacing: -0.035em;
        margin: 0 0 1.6rem;
      }
      h1 .line {
        display: block;
        overflow: hidden;
      }
      h1 .line span {
        display: block;
        transform: translateY(110%);
        animation: rise 1.15s var(--ease) forwards;
      }
      h1 .line:nth-child(2) span { animation-delay: 0.12s; }
      h1 .line:nth-child(3) span { animation-delay: 0.24s; }
      h1 em {
        font-style: italic;
        font-weight: 480;
        color: var(--copper);
      }
      .lede {
        max-width: 36rem;
        font-size: 1.12rem;
        font-weight: 300;
        color: var(--ink-soft);
        margin: 0 0 2rem;
        opacity: 0;
        animation: fade 1s var(--ease) 0.45s forwards;
      }
      .hero__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        opacity: 0;
        animation: fade 1s var(--ease) 0.6s forwards;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        text-decoration: none;
        border-radius: 999px;
        padding: 0.78rem 0.78rem 0.78rem 1.2rem;
        background: var(--ink);
        color: var(--cream);
        border: 1px solid var(--ink);
        transition: transform 0.45s var(--ease), background 0.3s;
      }
      .btn span.disc {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background: var(--ember);
        color: var(--night);
        display: grid;
        place-items: center;
        transition: transform 0.5s var(--ease);
      }
      .btn:hover { transform: translateY(-2px); }
      .btn:hover span.disc { transform: rotate(45deg); }
      .btn--ghost {
        background: transparent;
        color: var(--ink);
        padding: 0.9rem 1.25rem;
      }
      .btn--ghost:hover { background: rgba(26, 22, 18, 0.04); }
      .btn:focus-visible, .nav__toggle:focus-visible, a:focus-visible {
        outline: 2px solid var(--copper);
        outline-offset: 3px;
      }

      .stage {
        position: relative;
        min-height: 34rem;
        border-radius: 1.6rem;
        overflow: hidden;
        background:
          radial-gradient(120% 80% at 80% 10%, rgba(197, 106, 60, 0.55), transparent 55%),
          radial-gradient(90% 70% at 10% 90%, rgba(166, 132, 86, 0.45), transparent 50%),
          linear-gradient(160deg, #2a211c 0%, #14110f 70%);
        color: var(--cream);
        box-shadow: 0 30px 80px rgba(26, 22, 18, 0.18);
        transform: translateY(24px);
        opacity: 0;
        animation: fade 1.2s var(--ease) 0.2s forwards;
      }
      .orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(2px);
        animation: float 9s ease-in-out infinite;
      }
      .orb--a {
        width: 16rem;
        height: 16rem;
        right: -3rem;
        top: 2rem;
        background: radial-gradient(circle at 30% 30%, #f2d2b8, #c56a3c 45%, transparent 70%);
      }
      .orb--b {
        width: 11rem;
        height: 11rem;
        left: 8%;
        bottom: 12%;
        background: radial-gradient(circle at 40% 40%, #f7f3ec, #a68456 50%, transparent 72%);
        animation-delay: -3s;
      }
      .ring {
        position: absolute;
        width: 15rem;
        height: 15rem;
        border: 1px solid rgba(247, 243, 236, 0.35);
        border-radius: 50%;
        left: 18%;
        top: 22%;
        animation: spin 28s linear infinite;
      }
      .ring::before {
        content: "";
        position: absolute;
        width: 0.55rem;
        height: 0.55rem;
        background: var(--cream);
        border-radius: 50%;
        top: -0.25rem;
        left: 50%;
      }
      .ticket {
        position: absolute;
        left: 1.4rem;
        right: 1.4rem;
        bottom: 1.4rem;
        padding: 1.1rem 1.2rem;
        border-radius: 1rem;
        background: rgba(247, 243, 236, 0.1);
        border: 1px solid rgba(247, 243, 236, 0.18);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: end;
      }
      .ticket strong {
        display: block;
        font-family: var(--serif);
        font-weight: 500;
        font-size: 1.55rem;
        letter-spacing: -0.03em;
      }
      .ticket small { color: rgba(247, 243, 236, 0.72); }
      .ticket em {
        font-style: italic;
        font-family: var(--serif);
        font-size: 1.4rem;
      }

      .facts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        margin: 0 4vw 0;
      }
      .fact {
        padding: 1.5rem 1.2rem 1.6rem 0;
      }
      .fact + .fact { border-left: 1px solid var(--line); padding-left: 1.4rem; }
      .fact b {
        display: block;
        font-family: var(--serif);
        font-size: clamp(2rem, 3vw, 2.8rem);
        font-weight: 560;
        letter-spacing: -0.04em;
        line-height: 1;
      }
      .fact span { color: var(--muted); font-size: 0.92rem; }

      .marquee {
        overflow: hidden;
        border-bottom: 1px solid var(--line);
        padding: 0.95rem 0;
        margin-bottom: 5.5rem;
      }
      .marquee__track {
        display: flex;
        gap: 2.2rem;
        width: max-content;
        animation: ticker 28s linear infinite;
        font-family: var(--serif);
        font-style: italic;
        font-size: 1.35rem;
      }
      .marquee__track span { display: inline-flex; align-items: center; gap: 2.2rem; }
      .dot {
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 50%;
        background: var(--copper);
        display: inline-block;
      }

      section { padding: 0 4vw 6.5rem; }
      .section__head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 2rem;
        margin-bottom: 2.2rem;
      }
      .eyebrow {
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-size: 0.72rem;
        color: var(--muted);
        margin: 0 0 0.6rem;
      }
      h2 {
        font-family: var(--serif);
        font-weight: 520;
        font-size: clamp(2.4rem, 4.5vw, 4.2rem);
        letter-spacing: -0.035em;
        line-height: 0.95;
        margin: 0;
      }
      h2 em { font-style: italic; font-weight: 480; }
      .section__head p {
        max-width: 22rem;
        margin: 0;
        color: var(--muted);
        font-weight: 300;
      }

      .work {
        display: grid;
        grid-template-columns: 1.35fr 0.85fr;
        gap: 1.1rem;
      }
      .piece {
        position: relative;
        min-height: 26rem;
        border-radius: 1.3rem;
        overflow: hidden;
        color: var(--cream);
        text-decoration: none;
        isolation: isolate;
      }
      .piece--wide { grid-column: 1 / -1; min-height: 22rem; }
      .piece__art {
        position: absolute;
        inset: 0;
        transform: scale(1.04);
        transition: transform 0.8s var(--ease);
      }
      .piece:hover .piece__art { transform: scale(1.1); }
      .art-a {
        background:
          linear-gradient(160deg, rgba(18, 16, 14, 0.1), rgba(18, 16, 14, 0.45)),
          radial-gradient(circle at 70% 30%, #f0c7a4, transparent 42%),
          linear-gradient(200deg, #6d3b2a, #1a1411 70%);
      }
      .art-b {
        background:
          repeating-linear-gradient(90deg, rgba(247, 243, 236, 0.08) 0 1px, transparent 1px 48px),
          linear-gradient(180deg, #d9d1c4, #8d8478 40%, #221e1b);
      }
      .art-c {
        background:
          radial-gradient(circle at 20% 80%, rgba(166, 188, 176, 0.8), transparent 40%),
          radial-gradient(circle at 80% 20%, #e7d3b1, transparent 36%),
          linear-gradient(120deg, #cbb89a, #6e8f86 55%, #1d2422);
      }
      .piece figcaption {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 1.3rem 1.3rem 1.2rem;
        display: flex;
        justify-content: space-between;
        align-items: end;
        background: linear-gradient(transparent, rgba(12, 10, 8, 0.72));
      }
      .piece strong {
        display: block;
        font-family: var(--serif);
        font-size: 1.8rem;
        font-weight: 520;
        letter-spacing: -0.03em;
      }
      .piece small { opacity: 0.8; }
      .piece .go {
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 50%;
        border: 1px solid rgba(247, 243, 236, 0.4);
        display: grid;
        place-items: center;
        transition: background 0.3s, transform 0.45s var(--ease);
      }
      .piece:hover .go {
        background: var(--cream);
        color: var(--ink);
        transform: rotate(45deg);
      }

      .method {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
        border-top: 1px solid var(--line);
      }
      .step {
        padding: 1.6rem 1.2rem 0.4rem 0;
        border-bottom: 1px solid var(--line);
        min-height: 16rem;
      }
      .step + .step { border-left: 1px solid var(--line); padding-left: 1.2rem; }
      .step b {
        display: block;
        font-family: var(--serif);
        font-size: 1.7rem;
        font-weight: 520;
        letter-spacing: -0.03em;
        margin: 1.4rem 0 0.6rem;
      }
      .step p { margin: 0; color: var(--ink-soft); font-weight: 300; max-width: 16rem; }
      .idx { color: var(--copper); font-size: 0.82rem; letter-spacing: 0.14em; }

      .atelier {
        background: var(--night);
        color: var(--cream);
        border-radius: 1.8rem;
        margin: 0 2vw 6rem;
        padding: 4.5rem 3.2vw 3.5rem;
      }
      .atelier .eyebrow { color: rgba(247, 243, 236, 0.55); }
      .split {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: start;
      }
      .principles { list-style: none; margin: 1rem 0 0; padding: 0; }
      .principles li {
        display: grid;
        grid-template-columns: 7rem 1fr;
        gap: 1rem;
        padding: 1.05rem 0;
        border-top: 1px solid rgba(247, 243, 236, 0.12);
        font-weight: 300;
      }
      .principles strong { font-weight: 500; color: var(--gold); letter-spacing: 0.04em; font-size: 0.86rem; }

      .notes {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      .note {
        background: var(--cream);
        border: 1px solid var(--line);
        border-radius: 1.2rem;
        padding: 1.4rem 1.3rem 1.2rem;
        min-height: 15rem;
        display: flex;
        flex-direction: column;
        transition: transform 0.45s var(--ease), box-shadow 0.45s;
      }
      .note:hover {
        transform: translateY(-6px);
        box-shadow: 0 18px 40px rgba(26, 22, 18, 0.08);
      }
      .note__index { color: var(--gold); letter-spacing: 0.14em; font-size: 0.78rem; }
      .note blockquote {
        margin: 1rem 0 auto;
        font-family: var(--serif);
        font-size: 1.55rem;
        font-weight: 480;
        letter-spacing: -0.03em;
        line-height: 1.2;
      }
      .note footer { display: flex; align-items: center; gap: 0.6rem; color: var(--muted); }
      .note cite { font-style: normal; font-size: 0.92rem; }
      .note__mark { width: 1.4rem; height: 1px; background: var(--copper); }
      .notes__empty { color: var(--muted); }

      .close {
        margin: 0 4vw 3rem;
        padding: 4.5rem 0 1rem;
        border-top: 1px solid var(--line);
        display: grid;
        grid-template-columns: 1.4fr 0.8fr;
        gap: 2rem;
        align-items: end;
      }
      .close h2 { font-size: clamp(3rem, 6vw, 5.6rem); }
      .close p { color: var(--muted); font-weight: 300; margin-top: 0; }

      footer.site {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.2rem 4vw 1.6rem;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 0.88rem;
      }
      footer.site a { text-decoration: none; }
      footer.site a:hover { color: var(--ink); }

      .menu {
        position: fixed;
        inset: 0;
        background: rgba(18, 16, 14, 0.42);
        z-index: 35;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s;
      }
      .menu.is-open { opacity: 1; pointer-events: auto; }
      .menu__panel {
        margin-left: auto;
        width: min(24rem, 100%);
        height: 100%;
        background: var(--paper);
        padding: 6rem 2rem 2rem;
        transform: translateX(12%);
        transition: transform 0.5s var(--ease);
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
      }
      .menu.is-open .menu__panel { transform: none; }
      .menu a {
        font-family: var(--serif);
        font-size: 2.4rem;
        text-decoration: none;
        letter-spacing: -0.03em;
      }

      .reveal {
        opacity: 0;
        transform: translateY(28px);
        animation: rise-in 0.9s var(--ease) forwards;
        animation-delay: var(--d, 0ms);
        animation-play-state: paused;
      }
      .reveal.is-in { animation-play-state: running; }

      @keyframes rise {
        to { transform: none; }
      }
      @keyframes fade {
        to { opacity: 1; transform: none; }
      }
      @keyframes rise-in {
        to { opacity: 1; transform: none; }
      }
      @keyframes ticker {
        to { transform: translateX(-50%); }
      }
      @keyframes float {
        50% { transform: translateY(-18px); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse {
        70% { box-shadow: 0 0 0 8px rgba(197, 106, 60, 0); }
        100% { box-shadow: 0 0 0 0 rgba(197, 106, 60, 0); }
      }

      @media (max-width: 980px) {
        .nav__links, .nav__meta { display: none; }
        .nav__toggle { display: inline-flex; }
        .hero, .split, .close, .work, .method, .notes, .facts {
          grid-template-columns: 1fr;
        }
        .piece--wide { grid-column: auto; }
        .step + .step, .fact + .fact { border-left: 0; padding-left: 0; }
        .stage { min-height: 26rem; }
        .hero { padding-top: 7rem; min-height: auto; }
        .atelier { margin-inline: 0; border-radius: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }
        .reveal { opacity: 1; transform: none; }
        h1 .line span, .lede, .hero__actions, .stage { opacity: 1; transform: none; }
      }
    </style>
  </head>
  <body>
    <div class="progress" id="progress"></div>
    <svg class="grain" aria-hidden="true">
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noise)" />
    </svg>

    <header class="nav" id="nav">
      <a class="brand" href="#top">
        <span class="brand__mark">N</span>
        ATELIER NORA
      </a>
      <ul class="nav__links">
        <li><a href="#travail">Travail</a></li>
        <li><a href="#methode">Méthode</a></li>
        <li><a href="#atelier">Atelier</a></li>
        <li><a href="#notes">Notes</a></li>
      </ul>
      <div class="nav__meta">
        <span>Paris</span>
        <time id="clock">—</time>
        <a class="btn btn--ghost" href="#contact">Écrire</a>
      </div>
      <button class="nav__toggle" id="toggle" aria-expanded="false" aria-controls="menu">Menu</button>
    </header>

    <div class="menu" id="menu">
      <nav class="menu__panel" aria-label="Navigation mobile">
        <a href="#travail">Travail</a>
        <a href="#methode">Méthode</a>
        <a href="#atelier">Atelier</a>
        <a href="#notes">Notes</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>

    <main id="top">
      <section class="hero">
        <div>
          <p class="kicker"><i></i> Studio digital · Paris</p>
          <h1>
            <span class="line"><span>Le mouvement,</span></span>
            <span class="line"><span>au service</span></span>
            <span class="line"><span>de la <em>marque.</em></span></span>
          </h1>
          <p class="lede">
            Atelier Nora dessine des sites éditoriaux pour les maisons qui veulent être reconnues avant d’être lues. Typographie, rythme, et animations qui ne crient pas.
          </p>
          <div class="hero__actions">
            <a class="btn" href="#contact">
              Commencer un projet
              <span class="disc" aria-hidden="true">↗</span>
            </a>
            <a class="btn btn--ghost" href="#travail">Voir les pièces</a>
          </div>
        </div>
        <div class="stage" aria-hidden="true">
          <span class="orb orb--a"></span>
          <span class="orb orb--b"></span>
          <span class="ring"></span>
          <div class="ticket">
            <div>
              <small>Pièce en cours</small>
              <strong>Maison Céleste</strong>
            </div>
            <em>2026</em>
          </div>
        </div>
      </section>

      <div class="facts">
        <div class="fact reveal"><b data-count="12">0</b><span>maisons accompagnées</span></div>
        <div class="fact reveal" style="--d:80ms"><b data-count="48">0</b><span>interfaces livrées</span></div>
        <div class="fact reveal" style="--d:160ms"><b data-count="4.9" data-decimals="1">0</b><span>de retenue, sur 5</span></div>
      </div>

      <div class="marquee" aria-hidden="true">
        <div class="marquee__track">
          <span>Identité <i class="dot"></i> Motion <i class="dot"></i> Typographie <i class="dot"></i> Direction artistique <i class="dot"></i> Sites éditoriaux <i class="dot"></i> Systèmes <i class="dot"></i></span>
          <span>Identité <i class="dot"></i> Motion <i class="dot"></i> Typographie <i class="dot"></i> Direction artistique <i class="dot"></i> Sites éditoriaux <i class="dot"></i> Systèmes <i class="dot"></i></span>
        </div>
      </div>

      <section id="travail">
        <div class="section__head">
          <div>
            <p class="eyebrow">Travail choisi</p>
            <h2 class="reveal">Trois présences,<br /><em>une même tenue.</em></h2>
          </div>
          <p class="reveal" style="--d:120ms">Chaque pièce part d’une matière, d’une voix, et d’un geste. Le reste suit.</p>
        </div>
        <div class="work">
          <a class="piece reveal" href="#contact">
            <div class="piece__art art-a"></div>
            <figcaption>
              <div>
                <small>Parfum · 2025</small>
                <strong>Maison Céleste</strong>
              </div>
              <span class="go" aria-hidden="true">↗</span>
            </figcaption>
          </a>
          <a class="piece reveal" style="--d:100ms" href="#contact">
            <div class="piece__art art-b"></div>
            <figcaption>
              <div>
                <small>Architecture · 2024</small>
                <strong>Orée</strong>
              </div>
              <span class="go" aria-hidden="true">↗</span>
            </figcaption>
          </a>
          <a class="piece piece--wide reveal" href="#contact">
            <div class="piece__art art-c"></div>
            <figcaption>
              <div>
                <small>Hôtellerie · 2025</small>
                <strong>Sable &amp; Co</strong>
              </div>
              <span class="go" aria-hidden="true">↗</span>
            </figcaption>
          </a>
        </div>
      </section>

      <section id="methode">
        <div class="section__head">
          <div>
            <p class="eyebrow">Méthode</p>
            <h2 class="reveal">Quatre temps,<br /><em>aucun détour.</em></h2>
          </div>
        </div>
        <div class="method">
          <article class="step reveal">
            <span class="idx">01</span>
            <b>Écoute</b>
            <p>Un brief qui tient en une page. La marque, le public, ce qui doit rester.</p>
          </article>
          <article class="step reveal" style="--d:80ms">
            <span class="idx">02</span>
            <b>Direction</b>
            <p>Une typographie, une matière, une ligne. On tranche tôt.</p>
          </article>
          <article class="step reveal" style="--d:160ms">
            <span class="idx">03</span>
            <b>Motion</b>
            <p>Le mouvement sert le récit. Il apparaît, puis il s’efface.</p>
          </article>
          <article class="step reveal" style="--d:240ms">
            <span class="idx">04</span>
            <b>Livraison</b>
            <p>Un site rapide, lisible, prêt à être tenu sans nous.</p>
          </article>
        </div>
      </section>

      <section class="atelier" id="atelier">
        <div class="split">
          <div>
            <p class="eyebrow">L’atelier</p>
            <h2 class="reveal">Moins d’effets.<br /><em>Plus de tenue.</em></h2>
          </div>
          <ul class="principles">
            <li class="reveal"><strong>Matière</strong><span>Papier chaud, encre, cuivre. Une palette qui vieillit bien.</span></li>
            <li class="reveal" style="--d:70ms"><strong>Rythme</strong><span>De grands blancs, des titres qui respirent, des détails qui se méritent.</span></li>
            <li class="reveal" style="--d:140ms"><strong>Vitesse</strong><span>Aucune librairie pour faire joli. Le mouvement est écrit à la main.</span></li>
            <li class="reveal" style="--d:210ms"><strong>Voix</strong><span>Des phrases courtes. Une marque qui parle comme elle reçoit.</span></li>
          </ul>
        </div>
      </section>

      <section id="notes">
        <div class="section__head">
          <div>
            <p class="eyebrow">Carnet</p>
            <h2 class="reveal">Ce qu’on<br /><em>nous écrit.</em></h2>
          </div>
          <p class="reveal" style="--d:100ms">Notes réelles, tirées de la base D1 reliée à cet atelier.</p>
        </div>
        <div class="notes">
          ${notes}
        </div>
      </section>

      <div class="close" id="contact">
        <h2 class="reveal">Un site à la hauteur<br /><em>de la maison.</em></h2>
        <div>
          <p class="reveal">14 rue des Archives, 75004 Paris. Nous répondons sous deux jours.</p>
          <a class="btn reveal" href="mailto:atelier@norastudio.fr">
            atelier@norastudio.fr
            <span class="disc" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </main>

    <footer class="site">
      <span>© ${year} Atelier Nora</span>
      <a href="#top">Haut de page</a>
    </footer>

    <script>
      const nav = document.getElementById("nav");
      const progress = document.getElementById("progress");
      const clock = document.getElementById("clock");
      const toggle = document.getElementById("toggle");
      const menu = document.getElementById("menu");

      const formatClock = () =>
        new Intl.DateTimeFormat("fr-FR", {
          timeZone: "Europe/Paris",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date());

      const paintClock = () => {
        if (clock) clock.textContent = formatClock();
      };
      paintClock();
      setInterval(paintClock, 15000);

      const onScroll = () => {
        const scrolled = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        nav?.classList.toggle("is-stuck", scrolled > 12);
        if (progress && height > 0) {
          progress.style.transform = "scaleX(" + scrolled / height + ")";
        }
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const revealables = document.querySelectorAll(".reveal");
      if (reduce || !("IntersectionObserver" in window)) {
        revealables.forEach((node) => node.classList.add("is-in"));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-in");
              const target = entry.target.querySelector("[data-count]");
              if (target instanceof HTMLElement) countUp(target);
              io.unobserve(entry.target);
            }
          },
          { threshold: 0.18 },
        );
        revealables.forEach((node) => io.observe(node));
      }

      function countUp(el) {
        const end = Number(el.dataset.count);
        const decimals = Number(el.dataset.decimals || 0);
        const start = performance.now();
        const duration = 1100;
        const step = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = (end * eased).toFixed(decimals);
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }

      const setMenu = (open) => {
        menu?.classList.toggle("is-open", open);
        toggle?.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      };
      toggle?.addEventListener("click", () => {
        setMenu(!menu?.classList.contains("is-open"));
      });
      menu?.addEventListener("click", (event) => {
        if (event.target === menu || event.target instanceof HTMLAnchorElement) setMenu(false);
      });
    </script>
  </body>
</html>`;
}
