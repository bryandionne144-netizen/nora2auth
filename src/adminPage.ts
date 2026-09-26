import { defaultContent } from "./content";
import { jsonForScript } from "./util";

export function renderAdmin(): string {
	return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Espace pro · La Coche</title>
  <link rel="icon" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin.css" />
</head>
<body>
  <div id="login" class="login">
    <form id="login-form" class="login-card">
      <img src="/logo.png" alt="" width="92" height="92" />
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
        <img src="/logo.png" alt="" />
        <span>
          <strong>La Coche</strong>
          <em>Voir le site</em>
        </span>
      </a>
      <nav id="tabs"></nav>
    </aside>
    <div class="workspace">
      <header class="topbar">
        <label class="mobile-pick">
          Section
          <select id="tab-select"></select>
        </label>
        <div class="savebar" id="savebar">
          <span id="save-label">À jour</span>
          <button type="button" id="save-btn">Enregistrer</button>
        </div>
      </header>
      <div id="banner" class="banner" hidden></div>
      <main id="view"></main>
    </div>
  </div>
  <div id="toast" role="status"></div>
  <script type="application/json" id="lc-default">${jsonForScript(defaultContent)}</script>
  <script src="/render-site.js"></script>
  <script src="/admin.js"></script>
</body>
</html>`;
}
