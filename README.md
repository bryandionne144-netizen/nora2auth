# La Coche Esthétique Auto

Site vitrine pour La Coche, esthétique automobile mobile à Bellefeuille, Lac-Paul et Mirabel-Nord, avec un espace pro qui modifie tout le contenu.

Le site public est servi par un Worker Cloudflare. Les textes, prix, horaires, secteurs, soins et leur disponibilité vivent dans la base D1. L'espace pro écrit dans cette base, et la vitrine se met à jour tout de suite.

## Pages

- `/` — le site pour les visiteurs
- `/admin` — l'espace pro

Mot de passe initial : `LaCoche5538`

Changez-le dans **Compte** dès la première connexion. Tant qu'il n'est pas changé, un rappel reste affiché dans l'espace pro.

## Ce que l'espace pro contrôle

- Statut ouvert, complet ou fermé, et le message affiché
- Bandeau d'annonce
- Textes de l'accueil, de l'atelier, de la citation et du pied de page
- Soins : prix, durée, catégorie, signature, disponible ou indisponible
- Secteurs desservis, avec le même interrupteur
- Horaires, démarche, galerie, avis et questions
- Ordre et visibilité des sections
- Formulaire de rendez-vous, y compris le mettre en pause
- Demandes reçues : nouveau, confirmé, fait, annulé
- Coordonnées, Instagram, logo, menu et référencement

Les soins ou secteurs marqués indisponibles restent visibles sur le site, avec un badge, et disparaissent du formulaire.

## Développement

```bash
npm install
npm run db:local
npm run dev
```

Le site local s'ouvre sur le port indiqué par Wrangler, en général `http://127.0.0.1:8787`.

## Déploiement

```bash
npm run deploy
```

La commande applique d'abord les migrations D1 distantes.
