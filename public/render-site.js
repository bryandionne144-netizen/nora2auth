"use strict";
(() => {
  // src/util.ts
  function esc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function rich(value) {
    return esc(value).replace(/\n/g, "<br />");
  }
  function jsonForScript(value) {
    return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  function isObj(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function str(value, fallback, max = 400) {
    if (typeof value !== "string") return fallback;
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, max);
  }
  function keep(value, fallback, max = 400) {
    if (typeof value !== "string") return fallback;
    return value.trim().slice(0, max);
  }
  function todayInToronto() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(/* @__PURE__ */ new Date());
  }
  function optionalStr(value, max = 400) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, max);
  }
  function bool(value, fallback) {
    if (typeof value === "boolean") return value;
    return fallback;
  }
  function safeUrl(value) {
    if (typeof value !== "string") return "";
    const v = value.trim();
    if (!v) return "";
    if (v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\")) {
      return v.slice(0, 400);
    }
    try {
      const url = new URL(v);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString().slice(0, 500);
      }
    } catch {
      return "";
    }
    return "";
  }
  function idOf(value, prefix, index) {
    if (typeof value === "string" && /^[a-zA-Z0-9_-]{1,48}$/.test(value)) return value;
    return `${prefix}-${index + 1}`;
  }
  function uniqueIds(items, prefix) {
    const seen = /* @__PURE__ */ new Set();
    return items.map((item, index) => {
      let id = item.id;
      if (seen.has(id)) id = `${prefix}-${index + 1}`.slice(0, 48);
      seen.add(id);
      return { ...item, id };
    });
  }
  function instagramHref(handle) {
    const value = handle.trim();
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    const name = value.replace(/^@/, "");
    if (!name) return "";
    return `https://instagram.com/${encodeURIComponent(name)}`;
  }
  function telHref(phone) {
    const cleaned = phone.replace(/[^\d+]/g, "");
    return cleaned ? `tel:${cleaned}` : "";
  }

  // src/content.ts
  var MOTIFS = ["eau", "cuir", "chrome", "bac", "jantes", "nuit"];
  var SECTION_IDS = [
    "about",
    "services",
    "zones",
    "steps",
    "gallery",
    "quote",
    "testimonials",
    "hours",
    "faq",
    "booking"
  ];
  var defaultContent = {
    seo: {
      title: "La Coche Esth\xE9tique Auto | Lavage mobile",
      description: "Esth\xE9tique automobile mobile \xE0 Bellefeuille, Lac-Paul et Mirabel-Nord. Lavage int\xE9rieur, ext\xE9rieur et lavage de bac. 450-523-5538."
    },
    brand: {
      name: "La Coche Esth\xE9tique Auto",
      shortName: "La Coche",
      tagline: "Esth\xE9tique auto & lavage de bac",
      phone: "+14505235538",
      phoneDisplay: "450-523-5538",
      instagram: "@la.coche.estetique",
      email: "",
      logoUrl: "/logo.png"
    },
    nav: {
      about: "Atelier",
      services: "Soins",
      zones: "Secteurs",
      gallery: "Galerie",
      testimonials: "Avis",
      booking: "R\xE9server"
    },
    announcement: {
      enabled: true,
      text: "Service mobile \u2014 on se d\xE9place chez vous, dans votre entr\xE9e."
    },
    status: {
      state: "ouvert",
      message: "Disponible pour des rendez-vous"
    },
    hero: {
      kicker: "Bellefeuille \xB7 Lac-Paul \xB7 Mirabel-Nord",
      title: "L'\xE9clat, livr\xE9",
      highlight: "dans votre entr\xE9e.",
      subtitle: "La Coche, c'est l'esth\xE9tique auto qui vient \xE0 vous. Lavage soign\xE9, int\xE9rieur d\xE9taill\xE9 et bac de camion propre \u2014 sans que vous ayez \xE0 vous d\xE9placer.",
      primaryCta: "R\xE9server un soin",
      secondaryCta: "Voir les soins",
      note: "Un appel, un message Instagram, ou le formulaire. On confirme le cr\xE9neau avec vous."
    },
    marquee: [
      "Esth\xE9tique auto",
      "Lavage de bac",
      "Service mobile",
      "Bellefeuille",
      "Lac-Paul",
      "Mirabel-Nord",
      "Int\xE9rieur soign\xE9",
      "Finition brillante"
    ],
    stats: [
      { id: "stat-secteurs", value: "3", label: "secteurs desservis" },
      { id: "stat-focus", value: "1", label: "auto \xE0 la fois" },
      { id: "stat-bac", value: "Bac", label: "de pickup soign\xE9" },
      { id: "stat-mobile", value: "Mobile", label: "on vient chez vous" }
    ],
    about: {
      kicker: "L'atelier mobile",
      title: "Une auto nette, sans la file d'attente.",
      text: "On travaille \xE0 la main, un v\xE9hicule \xE0 la fois. Produits adapt\xE9s \xE0 la peinture et \xE0 l'habitacle, finition nette, et le respect de votre horaire. Vous restez chez vous. On s'occupe du reste.",
      points: [
        {
          id: "pt-deplace",
          title: "On se d\xE9place",
          text: "Bellefeuille, Lac-Paul et Mirabel-Nord, directement \xE0 votre adresse."
        },
        {
          id: "pt-temps",
          title: "Un v\xE9hicule \xE0 la fois",
          text: "Pas de tunnel, pas de rush. Chaque auto a le temps qu'il faut."
        },
        {
          id: "pt-bac",
          title: "Le bac, vraiment",
          text: "Le lavage de bac de pickup fait partie de la maison, pas d'un extra oubli\xE9."
        },
        {
          id: "pt-rdv",
          title: "Rendez-vous simple",
          text: "Un message, un appel, un cr\xE9neau. On confirme avant de passer."
        }
      ]
    },
    servicesIntro: {
      kicker: "Les soins",
      title: "Choisissez le niveau de fini.",
      text: "Les prix indiqu\xE9s sont un point de d\xE9part. On confirme le tarif exact selon l'\xE9tat du v\xE9hicule, avant la visite."
    },
    services: [
      {
        id: "svc-exterieur",
        name: "Lavage ext\xE9rieur signature",
        category: "Ext\xE9rieur",
        description: "Lavage \xE0 la main, jantes comprises, s\xE9chage sans traces et une finition qui accroche la lumi\xE8re.",
        price: "D\xE8s 49 $",
        duration: "45 min",
        availability: "disponible",
        featured: false
      },
      {
        id: "svc-interieur",
        name: "Int\xE9rieur complet",
        category: "Int\xE9rieur",
        description: "Aspiration en profondeur, plastiques, vitres int\xE9rieures, coffre et une habitacle remise en ordre.",
        price: "D\xE8s 79 $",
        duration: "75 min",
        availability: "disponible",
        featured: false
      },
      {
        id: "svc-combo",
        name: "Combo signature",
        category: "Complet",
        description: "Ext\xE9rieur et int\xE9rieur dans la m\xEAme visite. L'auto repart vraiment nette, pas juste rinc\xE9e.",
        price: "D\xE8s 119 $",
        duration: "2 h",
        availability: "disponible",
        featured: true
      },
      {
        id: "svc-bac",
        name: "Lavage de bac",
        category: "Bac",
        description: "Le bac de pickup vid\xE9 du gros, lav\xE9 et rinc\xE9. Boue, sel d'hiver et poussi\xE8re de chantier.",
        price: "D\xE8s 59 $",
        duration: "40 min",
        availability: "disponible",
        featured: true
      },
      {
        id: "svc-cire",
        name: "Cire de protection",
        category: "Protection",
        description: "Une couche de cire pour l'\xE9clat et une meilleure tenue face \xE0 la pluie et \xE0 la route.",
        price: "D\xE8s 69 $",
        duration: "30 min",
        availability: "disponible",
        featured: false
      },
      {
        id: "svc-si\xE8ges",
        name: "Shampooing des si\xE8ges",
        category: "Int\xE9rieur",
        description: "Tissus ou tapis : on l\xE8ve les taches du quotidien et on rafra\xEEchit l'habitacle.",
        price: "D\xE8s 89 $",
        duration: "90 min",
        availability: "disponible",
        featured: false
      },
      {
        id: "svc-jantes",
        name: "Jantes & pneus",
        category: "Ext\xE9rieur",
        description: "D\xE9contamination des jantes et pneus nourris. Le d\xE9tail qu'on voit en premier.",
        price: "D\xE8s 35 $",
        duration: "25 min",
        availability: "disponible",
        featured: false
      },
      {
        id: "svc-detail",
        name: "D\xE9tailing complet",
        category: "Complet",
        description: "Le grand soin : int\xE9rieur, ext\xE9rieur, protection et les finitions qu'on ne b\xE2cle pas.",
        price: "D\xE8s 199 $",
        duration: "3 h",
        availability: "disponible",
        featured: false
      }
    ],
    zonesIntro: {
      kicker: "Secteurs",
      title: "On vient \xE0 vous.",
      text: "Trois secteurs, le m\xEAme soin. Si votre adresse est juste \xE0 c\xF4t\xE9, \xE9crivez-nous quand m\xEAme."
    },
    zones: [
      {
        id: "zone-bellefeuille",
        name: "Bellefeuille",
        area: "Saint-J\xE9r\xF4me",
        description: "Service mobile dans Bellefeuille, directement dans votre entr\xE9e.",
        availability: "disponible"
      },
      {
        id: "zone-lacpaul",
        name: "Lac-Paul",
        area: "Laurentides",
        description: "On se d\xE9place dans le secteur Lac-Paul, sur rendez-vous.",
        availability: "disponible"
      },
      {
        id: "zone-mirabel",
        name: "Mirabel-Nord",
        area: "Mirabel",
        description: "Esth\xE9tique auto \xE0 domicile dans Mirabel-Nord.",
        availability: "disponible"
      }
    ],
    stepsIntro: {
      kicker: "La d\xE9marche",
      title: "Quatre \xE9tapes, z\xE9ro d\xE9placement pour vous.",
      text: "De la demande \xE0 l'auto qui s\xE8che au soleil dans votre cour."
    },
    steps: [
      {
        id: "step-1",
        title: "Vous \xE9crivez",
        text: "Un appel, un texto, Instagram ou le formulaire. Le soin, le secteur, le moment."
      },
      {
        id: "step-2",
        title: "On confirme",
        text: "On vous revient avec un cr\xE9neau clair et le prix confirm\xE9 avant de se d\xE9placer."
      },
      {
        id: "step-3",
        title: "On se d\xE9place",
        text: "L'atelier vient \xE0 vous. On arrive \xE9quip\xE9s, pr\xEAts \xE0 travailler sur place."
      },
      {
        id: "step-4",
        title: "Vous profitez",
        text: "Une auto fra\xEEche. Vous, vous n'avez pas fait la file."
      }
    ],
    galleryIntro: {
      kicker: "Le fini",
      title: "Ce qu'on laisse derri\xE8re nous.",
      text: "De l'eau, du temps, et une auto qui a l'air de sortir de quelque part de mieux qu'un tunnel."
    },
    gallery: [
      {
        id: "gal-chrome",
        title: "Finition miroir",
        caption: "L'ext\xE9rieur, lav\xE9 et s\xE9ch\xE9 \xE0 la main.",
        imageUrl: "",
        motif: "chrome",
        visible: true
      },
      {
        id: "gal-cuir",
        title: "Habitacle net",
        caption: "Aspiration, plastiques, vitres.",
        imageUrl: "",
        motif: "cuir",
        visible: true
      },
      {
        id: "gal-bac",
        title: "Bac de pickup",
        caption: "Vid\xE9, lav\xE9, rinc\xE9.",
        imageUrl: "",
        motif: "bac",
        visible: true
      },
      {
        id: "gal-eau",
        title: "Eau & mousse",
        caption: "Un lavage patient, pas une douche rapide.",
        imageUrl: "",
        motif: "eau",
        visible: true
      },
      {
        id: "gal-jantes",
        title: "Jantes",
        caption: "Le d\xE9tail qu'on remarque en premier.",
        imageUrl: "",
        motif: "jantes",
        visible: true
      },
      {
        id: "gal-nuit",
        title: "Sous les lumi\xE8res",
        caption: "La brillance, le soir venu.",
        imageUrl: "",
        motif: "nuit",
        visible: true
      }
    ],
    quote: {
      text: "Pas un tunnel. Pas une file. Juste votre auto, et le temps de bien la faire.",
      by: "La Coche"
    },
    testimonialsIntro: {
      kicker: "Ils en parlent",
      title: "Le genre de retour qu'on vise.",
      text: "Une visite \xE0 la maison, un bac propre, un int\xE9rieur qui sent le frais. C'est \xE7a, le standard."
    },
    testimonials: [
      {
        id: "avis-1",
        name: "Client",
        area: "Bellefeuille",
        text: "Ils sont venus dans l'entr\xE9e. Le bac de mon pickup n'avait pas \xE9t\xE9 aussi propre depuis longtemps.",
        stars: 5,
        visible: true
      },
      {
        id: "avis-2",
        name: "Client",
        area: "Mirabel-Nord",
        text: "Prise de rendez-vous simple, travail soign\xE9, et je n'ai pas attendu dans un lave-auto.",
        stars: 5,
        visible: true
      },
      {
        id: "avis-3",
        name: "Client",
        area: "Lac-Paul",
        text: "L'int\xE9rieur sent le propre, pas un parfum chimique. C'est exactement ce que je voulais.",
        stars: 5,
        visible: true
      }
    ],
    hoursIntro: {
      kicker: "Horaires",
      title: "Sur rendez-vous.",
      note: "Ces heures sont celles o\xF9 on prend les rendez-vous. Le soin se fait chez vous."
    },
    hours: [
      { id: "hour-lun", day: "Lundi", hours: "Ferm\xE9", closed: true },
      { id: "hour-mar", day: "Mardi", hours: "8 h \u2013 18 h", closed: false },
      { id: "hour-mer", day: "Mercredi", hours: "8 h \u2013 18 h", closed: false },
      { id: "hour-jeu", day: "Jeudi", hours: "8 h \u2013 18 h", closed: false },
      { id: "hour-ven", day: "Vendredi", hours: "8 h \u2013 18 h", closed: false },
      { id: "hour-sam", day: "Samedi", hours: "8 h \u2013 17 h", closed: false },
      { id: "hour-dim", day: "Dimanche", hours: "Sur demande", closed: false }
    ],
    faqIntro: {
      kicker: "Questions",
      title: "Avant de nous \xE9crire."
    },
    faq: [
      {
        id: "faq-ou",
        question: "Vous vous d\xE9placez vraiment?",
        answer: "Oui. On couvre Bellefeuille, Lac-Paul et Mirabel-Nord. Si votre adresse est limite, \xE9crivez-nous, on vous dit oui ou non clairement."
      },
      {
        id: "faq-la",
        question: "Faut-il que je sois sur place?",
        answer: "Id\xE9alement oui, pour l'acc\xE8s au v\xE9hicule. On confirme les d\xE9tails \u2014 eau, entr\xE9e, stationnement \u2014 en prenant le rendez-vous."
      },
      {
        id: "faq-eau",
        question: "Vous avez besoin d'eau ou d'\xE9lectricit\xE9?",
        answer: "On arrive avec le mat\xE9riel. Un acc\xE8s \xE0 l'eau est utile pour certains soins. On vous le dit avant, jamais \xE0 la derni\xE8re minute."
      },
      {
        id: "faq-bac",
        question: "Le lavage de bac, \xE7a inclut quoi?",
        answer: "On retire le gros, on lave et on rince le bac de pickup. S'il reste un chargement \xE0 enlever, dites-le en r\xE9servant."
      },
      {
        id: "faq-prix",
        question: "Comment je paie, et le prix est-il fixe?",
        answer: "On confirme le prix avant la visite, selon l'\xE9tat de l'auto. Le paiement se fait au rendez-vous."
      },
      {
        id: "faq-off",
        question: "Et si un soin est marqu\xE9 indisponible?",
        answer: "Il reste visible pour que vous sachiez qu'on l'offre, mais il ne peut pas \xEAtre r\xE9serv\xE9 tant qu'on ne le rouvre pas."
      }
    ],
    booking: {
      enabled: true,
      kicker: "Rendez-vous",
      title: "Dites-nous quand on passe.",
      text: "Envoyez la demande. On vous r\xE9pond par t\xE9l\xE9phone pour confirmer le soin, le secteur et l'heure.",
      submitLabel: "Envoyer la demande",
      successTitle: "Demande re\xE7ue.",
      successText: "On vous rappelle bient\xF4t pour confirmer. Si c'est urgent, appelez directement.",
      pauseMessage: "Les demandes en ligne sont en pause. Appelez-nous ou \xE9crivez sur Instagram.",
      disclaimer: "La demande n'est pas une confirmation. On vous rappelle pour bloquer le cr\xE9neau.",
      labels: {
        name: "Nom",
        phone: "T\xE9l\xE9phone",
        email: "Courriel",
        service: "Soin",
        zone: "Secteur",
        date: "Date souhait\xE9e",
        message: "D\xE9tails"
      }
    },
    footer: {
      blurb: "Esth\xE9tique automobile mobile. On lave, on d\xE9taille et on remet votre bac \xE0 neuf \u2014 chez vous.",
      note: "La Coche Esth\xE9tique Auto \xB7 Service sur rendez-vous"
    },
    sections: {
      about: true,
      services: true,
      zones: true,
      steps: true,
      gallery: false,
      quote: true,
      testimonials: true,
      hours: true,
      faq: true,
      booking: true
    },
    sectionOrder: [
      "about",
      "services",
      "zones",
      "steps",
      "gallery",
      "quote",
      "testimonials",
      "hours",
      "faq",
      "booking"
    ],
    internalNote: "Ajustez les prix et remplacez les avis d'exemple avant de partager le site."
  };
  function availability(value, fallback) {
    return value === "disponible" || value === "indisponible" ? value : fallback;
  }
  function motifOf(value, fallback) {
    return MOTIFS.includes(value) ? value : fallback;
  }
  function starsOf(value) {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return 5;
    return Math.max(1, Math.min(5, Math.round(n)));
  }
  function normalizeContent(input) {
    const base = structuredClone(defaultContent);
    if (!isObj(input)) return base;
    const src = input;
    if (isObj(src.seo)) {
      base.seo.title = str(src.seo.title, base.seo.title, 140);
      base.seo.description = str(src.seo.description, base.seo.description, 300);
    }
    if (isObj(src.brand)) {
      base.brand.name = str(src.brand.name, base.brand.name, 80);
      base.brand.shortName = str(src.brand.shortName, base.brand.shortName, 40);
      base.brand.tagline = str(src.brand.tagline, base.brand.tagline, 120);
      base.brand.phone = str(src.brand.phone, base.brand.phone, 24);
      base.brand.phoneDisplay = str(src.brand.phoneDisplay, base.brand.phoneDisplay, 32);
      base.brand.instagram = str(src.brand.instagram, base.brand.instagram, 80);
      base.brand.email = optionalStr(src.brand.email, 120);
      base.brand.logoUrl = safeUrl(src.brand.logoUrl) || "/logo.png";
    }
    if (isObj(src.nav)) {
      const nav = src.nav;
      Object.keys(base.nav).forEach((key) => {
        base.nav[key] = str(nav[key], base.nav[key], 32);
      });
    }
    if (isObj(src.announcement)) {
      base.announcement.enabled = bool(src.announcement.enabled, base.announcement.enabled);
      base.announcement.text = keep(src.announcement.text, base.announcement.text, 180);
    }
    if (isObj(src.status)) {
      const state = src.status.state;
      base.status.state = state === "ouvert" || state === "complet" || state === "ferme" ? state : "ouvert";
      base.status.message = keep(src.status.message, base.status.message, 160);
    }
    if (isObj(src.hero)) {
      base.hero.kicker = str(src.hero.kicker, base.hero.kicker, 120);
      base.hero.title = str(src.hero.title, base.hero.title, 80);
      base.hero.highlight = keep(src.hero.highlight, base.hero.highlight, 80);
      base.hero.subtitle = keep(src.hero.subtitle, base.hero.subtitle, 400);
      base.hero.primaryCta = str(src.hero.primaryCta, base.hero.primaryCta, 40);
      base.hero.secondaryCta = str(src.hero.secondaryCta, base.hero.secondaryCta, 40);
      base.hero.note = keep(src.hero.note, base.hero.note, 220);
    }
    if (Array.isArray(src.marquee)) {
      base.marquee = src.marquee.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 24).map((item) => item.slice(0, 48));
    }
    base.stats = normalizeStats(src.stats, base.stats);
    if (isObj(src.about)) {
      base.about.kicker = str(src.about.kicker, base.about.kicker, 60);
      base.about.title = str(src.about.title, base.about.title, 120);
      base.about.text = keep(src.about.text, base.about.text, 800);
      base.about.points = normalizePoints(src.about.points, base.about.points);
    }
    if (isObj(src.servicesIntro)) {
      base.servicesIntro.kicker = str(src.servicesIntro.kicker, base.servicesIntro.kicker, 60);
      base.servicesIntro.title = str(src.servicesIntro.title, base.servicesIntro.title, 120);
      base.servicesIntro.text = keep(src.servicesIntro.text, base.servicesIntro.text, 400);
    }
    base.services = normalizeServices(src.services, base.services);
    if (isObj(src.zonesIntro)) {
      base.zonesIntro.kicker = str(src.zonesIntro.kicker, base.zonesIntro.kicker, 60);
      base.zonesIntro.title = str(src.zonesIntro.title, base.zonesIntro.title, 120);
      base.zonesIntro.text = keep(src.zonesIntro.text, base.zonesIntro.text, 400);
    }
    base.zones = normalizeZones(src.zones, base.zones);
    if (isObj(src.stepsIntro)) {
      base.stepsIntro.kicker = str(src.stepsIntro.kicker, base.stepsIntro.kicker, 60);
      base.stepsIntro.title = str(src.stepsIntro.title, base.stepsIntro.title, 140);
      base.stepsIntro.text = keep(src.stepsIntro.text, base.stepsIntro.text, 400);
    }
    base.steps = normalizeSteps(src.steps, base.steps);
    if (isObj(src.galleryIntro)) {
      base.galleryIntro.kicker = str(src.galleryIntro.kicker, base.galleryIntro.kicker, 60);
      base.galleryIntro.title = str(src.galleryIntro.title, base.galleryIntro.title, 140);
      base.galleryIntro.text = keep(src.galleryIntro.text, base.galleryIntro.text, 400);
    }
    base.gallery = normalizeGallery(src.gallery, base.gallery);
    if (isObj(src.quote)) {
      base.quote.text = keep(src.quote.text, base.quote.text, 280);
      base.quote.by = str(src.quote.by, base.quote.by, 60);
    }
    if (isObj(src.testimonialsIntro)) {
      base.testimonialsIntro.kicker = str(src.testimonialsIntro.kicker, base.testimonialsIntro.kicker, 60);
      base.testimonialsIntro.title = str(src.testimonialsIntro.title, base.testimonialsIntro.title, 140);
      base.testimonialsIntro.text = keep(src.testimonialsIntro.text, base.testimonialsIntro.text, 400);
    }
    base.testimonials = normalizeTestimonials(src.testimonials, base.testimonials);
    if (isObj(src.hoursIntro)) {
      base.hoursIntro.kicker = str(src.hoursIntro.kicker, base.hoursIntro.kicker, 60);
      base.hoursIntro.title = str(src.hoursIntro.title, base.hoursIntro.title, 120);
      base.hoursIntro.note = keep(src.hoursIntro.note, base.hoursIntro.note, 300);
    }
    base.hours = normalizeHours(src.hours, base.hours);
    if (isObj(src.faqIntro)) {
      base.faqIntro.kicker = str(src.faqIntro.kicker, base.faqIntro.kicker, 60);
      base.faqIntro.title = str(src.faqIntro.title, base.faqIntro.title, 140);
    }
    base.faq = normalizeFaq(src.faq, base.faq);
    if (isObj(src.booking)) {
      base.booking.enabled = bool(src.booking.enabled, base.booking.enabled);
      base.booking.kicker = str(src.booking.kicker, base.booking.kicker, 60);
      base.booking.title = str(src.booking.title, base.booking.title, 140);
      base.booking.text = keep(src.booking.text, base.booking.text, 400);
      base.booking.submitLabel = str(src.booking.submitLabel, base.booking.submitLabel, 40);
      base.booking.successTitle = str(src.booking.successTitle, base.booking.successTitle, 80);
      base.booking.successText = keep(src.booking.successText, base.booking.successText, 300);
      base.booking.pauseMessage = keep(src.booking.pauseMessage, base.booking.pauseMessage, 300);
      base.booking.disclaimer = keep(src.booking.disclaimer, base.booking.disclaimer, 240);
      if (isObj(src.booking.labels)) {
        const labels = src.booking.labels;
        Object.keys(base.booking.labels).forEach((key) => {
          base.booking.labels[key] = str(labels[key], base.booking.labels[key], 40);
        });
      }
    }
    if (isObj(src.footer)) {
      base.footer.blurb = keep(src.footer.blurb, base.footer.blurb, 300);
      base.footer.note = str(src.footer.note, base.footer.note, 160);
    }
    if (isObj(src.sections)) {
      for (const id of SECTION_IDS) {
        base.sections[id] = bool(src.sections[id], base.sections[id]);
      }
    }
    if (Array.isArray(src.sectionOrder)) {
      const seen = /* @__PURE__ */ new Set();
      const order = [];
      for (const item of src.sectionOrder) {
        if (SECTION_IDS.includes(item) && !seen.has(item)) {
          seen.add(item);
          order.push(item);
        }
      }
      for (const id of SECTION_IDS) {
        if (!seen.has(id)) order.push(id);
      }
      base.sectionOrder = order;
    }
    base.internalNote = optionalStr(src.internalNote, 500);
    return base;
  }
  function normalizeStats(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 8).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "stat", index),
          value: str(item.value, "\u2014", 16),
          label: str(item.label, "Libell\xE9", 48)
        }
      ];
    });
    return uniqueIds(items, "stat");
  }
  function normalizePoints(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 8).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "pt", index),
          title: str(item.title, "Point", 60),
          text: str(item.text, "", 240)
        }
      ];
    });
    return uniqueIds(items, "pt");
  }
  function normalizeServices(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 40).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "svc", index),
          name: str(item.name, "Soin", 80),
          category: str(item.category, "Soin", 32),
          description: str(item.description, "", 400),
          price: str(item.price, "Sur demande", 32),
          duration: str(item.duration, "", 32),
          availability: availability(item.availability, "disponible"),
          featured: bool(item.featured, false)
        }
      ];
    });
    return uniqueIds(items, "svc");
  }
  function normalizeZones(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 16).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "zone", index),
          name: str(item.name, "Secteur", 48),
          area: optionalStr(item.area, 48),
          description: str(item.description, "", 300),
          availability: availability(item.availability, "disponible")
        }
      ];
    });
    return uniqueIds(items, "zone");
  }
  function normalizeHours(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 14).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "hour", index),
          day: str(item.day, "Jour", 24),
          hours: str(item.hours, "Sur demande", 40),
          closed: bool(item.closed, false)
        }
      ];
    });
    return uniqueIds(items, "hour");
  }
  function normalizeSteps(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 8).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "step", index),
          title: str(item.title, "\xC9tape", 60),
          text: str(item.text, "", 280)
        }
      ];
    });
    return uniqueIds(items, "step");
  }
  function normalizeGallery(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 18).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "gal", index),
          title: str(item.title, "Visuel", 60),
          caption: optionalStr(item.caption, 160),
          imageUrl: safeUrl(item.imageUrl),
          motif: motifOf(item.motif, "eau"),
          visible: bool(item.visible, true)
        }
      ];
    });
    return uniqueIds(items, "gal");
  }
  function normalizeTestimonials(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 24).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "avis", index),
          name: str(item.name, "Client", 48),
          area: optionalStr(item.area, 48),
          text: str(item.text, "", 400),
          stars: starsOf(item.stars),
          visible: bool(item.visible, true)
        }
      ];
    });
    return uniqueIds(items, "avis");
  }
  function normalizeFaq(input, fallback) {
    if (!Array.isArray(input)) return fallback;
    const items = input.slice(0, 24).flatMap((item, index) => {
      if (!isObj(item)) return [];
      return [
        {
          id: idOf(item.id, "faq", index),
          question: str(item.question, "Question", 160),
          answer: str(item.answer, "", 600)
        }
      ];
    });
    return uniqueIds(items, "faq");
  }

  // src/publicPage.ts
  var STATUS_LABEL = {
    ouvert: "Ouvert",
    complet: "Complet",
    ferme: "Ferm\xE9"
  };
  function todayName() {
    return new Intl.DateTimeFormat("fr-CA", {
      weekday: "long",
      timeZone: "America/Toronto"
    }).format(/* @__PURE__ */ new Date()).toLowerCase();
  }
  function featuredService(content) {
    return content.services.find((item) => item.featured && item.availability === "disponible") || content.services.find((item) => item.availability === "disponible");
  }
  function renderPublic(content, requestUrl) {
    const phoneLink = telHref(content.brand.phone || content.brand.phoneDisplay);
    const instagram = instagramHref(content.brand.instagram);
    const logo = content.brand.logoUrl || "/logo.png";
    const origin = requestUrl.origin;
    const visible = new Set(content.sectionOrder.filter((id) => content.sections[id]));
    const sections = content.sectionOrder.filter((id) => visible.has(id)).map((id) => renderSection(id, content, phoneLink)).join("\n");
    const feature = featuredService(content);
    const nav = [
      ["about", "atelier", content.nav.about],
      ["services", "soins", content.nav.services],
      ["zones", "secteurs", content.nav.zones],
      ["gallery", "galerie", content.nav.gallery],
      ["testimonials", "avis", content.nav.testimonials]
    ].filter(([id]) => visible.has(id));
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
      description: content.seo.description
    };
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>document.documentElement.classList.add("js")<\/script>
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
  <script type="application/ld+json">${jsonForScript(jsonLd)}<\/script>
</head>
<body>
  <div class="progress" aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"><span></span><span></span><span></span></div>
  <div class="grid-bg" aria-hidden="true"></div>
  ${content.announcement.enabled ? `<div class="announce"><p>${esc(content.announcement.text)}</p></div>` : ""}
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
        ${phoneLink ? `<a class="nav-phone" href="${esc(phoneLink)}">${esc(content.brand.phoneDisplay)}</a>` : ""}
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
          ${visible.has("services") ? `<a class="btn btn-ghost" href="#soins">${esc(content.hero.secondaryCta)}</a>` : ""}
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
        ${feature ? `<aside class="float-card">
              <span>${feature.featured ? "Signature" : "Disponible"}</span>
              <strong>${esc(feature.name)}</strong>
              <em>${esc(feature.price)}${feature.duration ? ` \xB7 ${esc(feature.duration)}` : ""}</em>
            </aside>` : ""}
      </div>
    </section>

    ${content.marquee.length ? `<div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(
      () => `<div class="marquee-group">${content.marquee.map((item) => `<span>${esc(item)}</span><i></i>`).join("")}</div>`
    ).join("")}</div></div>` : ""}

    ${content.stats.length ? `<section class="stats-wrap"><div class="container stats">${content.stats.map(
      (item, index) => `<article class="reveal" style="--d:${index * 70}ms"><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></article>`
    ).join("")}</div></section>` : ""}

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
        ${content.zones.map(
      (zone) => `<p>${esc(zone.name)}${zone.availability === "indisponible" ? " \xB7 indisponible" : ""}</p>`
    ).join("")}
      </div>
      <div>
        <h2>Horaires</h2>
        ${content.hours.map((hour) => `<p>${esc(hour.day)} \xB7 ${esc(hour.closed ? "Ferm\xE9" : hour.hours)}</p>`).join("")}
      </div>
    </div>
    <div class="container footer-bar">
      <p>${esc(content.footer.note)}</p>
      <a href="/admin">Espace pro</a>
    </div>
  </footer>
  ${phoneLink ? `<a class="call-fab" href="${esc(phoneLink)}">Appeler<span>${esc(content.brand.phoneDisplay)}</span></a>` : ""}
  <script src="/site.js"><\/script>
  <script>
    setTimeout(function () {
      if (document.documentElement.dataset.motion) return;
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    }, 1600);
  <\/script>
</body>
</html>`;
  }
  function renderSection(id, content, phoneLink) {
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
  function head(kicker, title, text = "") {
    return `<div class="section-head reveal">
    <p class="kicker">${esc(kicker)}</p>
    <h2>${esc(title)}</h2>
    ${text ? `<p>${esc(text)}</p>` : ""}
  </div>`;
  }
  function renderAbout(content) {
    return `<section class="section" id="atelier">
    <div class="container about-grid">
      <div>
        ${head(content.about.kicker, content.about.title, content.about.text)}
      </div>
      <div class="points">
        ${content.about.points.map(
      (point, index) => `<article class="reveal" style="--d:${index * 70}ms">
            <span>0${index + 1}</span>
            <h3>${esc(point.title)}</h3>
            <p>${rich(point.text)}</p>
          </article>`
    ).join("")}
      </div>
    </div>
  </section>`;
  }
  function renderServices(content) {
    const categories = [...new Set(content.services.map((item) => item.category).filter(Boolean))];
    return `<section class="section" id="soins">
    <div class="container">
      ${head(content.servicesIntro.kicker, content.servicesIntro.title, content.servicesIntro.text)}
      ${categories.length > 1 ? `<div class="filters" role="tablist">${["Tout", ...categories].map(
      (category, index) => `<button type="button" class="chip${index === 0 ? " on" : ""}" data-filter="${index === 0 ? "all" : esc(category)}">${esc(category)}</button>`
    ).join("")}</div>` : ""}
      <div class="service-grid">
        ${content.services.map((service, index) => serviceCard(service, index)).join("")}
      </div>
    </div>
  </section>`;
  }
  function serviceCard(service, index) {
    const off = service.availability !== "disponible";
    return `<article class="service reveal${service.featured ? " featured" : ""}${off ? " off" : ""}" data-category="${esc(service.category)}" style="--d:${index % 3 * 80}ms">
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
  function renderZones(content) {
    return `<section class="section" id="secteurs">
    <div class="container">
      ${head(content.zonesIntro.kicker, content.zonesIntro.title, content.zonesIntro.text)}
      <div class="zone-grid">
        ${content.zones.map((zone, index) => zoneCard(zone, index)).join("")}
      </div>
    </div>
  </section>`;
  }
  function zoneCard(zone, index) {
    const off = zone.availability !== "disponible";
    return `<article class="zone reveal${off ? " off" : ""}" style="--d:${index * 80}ms">
    <span class="zone-index">${String(index + 1).padStart(2, "0")}</span>
    <h3>${esc(zone.name)}</h3>
    ${zone.area ? `<p class="zone-area">${esc(zone.area)}</p>` : ""}
    <p>${rich(zone.description)}</p>
    <span class="pill ${off ? "bad" : "ok"}">${off ? "Secteur complet" : "On s'y d\xE9place"}</span>
  </article>`;
  }
  function renderSteps(content) {
    return `<section class="section" id="demarche">
    <div class="container">
      ${head(content.stepsIntro.kicker, content.stepsIntro.title, content.stepsIntro.text)}
      <div class="steps">
        ${content.steps.map(
      (step, index) => `<article class="step reveal" style="--d:${index * 80}ms">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <h3>${esc(step.title)}</h3>
            <p>${rich(step.text)}</p>
          </article>`
    ).join("")}
      </div>
    </div>
  </section>`;
  }
  function renderGallery(content) {
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
  function galleryCard(item, index) {
    const photo = item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" />` : `<span class="motif motif-${esc(item.motif)}"></span>`;
    return `<article class="tile reveal" style="--d:${index % 3 * 70}ms">
    <div class="tile-visual">${photo}<span class="tile-index">${String(index + 1).padStart(2, "0")}</span></div>
    <div class="tile-copy">
      <h3>${esc(item.title)}</h3>
      ${item.caption ? `<p>${esc(item.caption)}</p>` : ""}
    </div>
  </article>`;
  }
  function renderQuote(content) {
    return `<section class="quote-band">
    <div class="container">
      <p class="quote-mark" aria-hidden="true">\u201C</p>
      <blockquote>${esc(content.quote.text)}</blockquote>
      <p class="quote-by">${esc(content.quote.by)}</p>
    </div>
  </section>`;
  }
  function renderTestimonials(content) {
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
  function reviewCard(item, index) {
    const stars = Math.max(1, Math.min(5, item.stars));
    return `<article class="review reveal" style="--d:${index * 70}ms">
    <p class="stars" aria-label="${stars} sur 5">${"\u2605".repeat(stars)}${"\u2606".repeat(5 - stars)}</p>
    <blockquote>${rich(item.text)}</blockquote>
    <p class="who"><strong>${esc(item.name)}</strong>${item.area ? `<span>${esc(item.area)}</span>` : ""}</p>
  </article>`;
  }
  function renderHours(content) {
    const today = todayName();
    return `<section class="section" id="horaires">
    <div class="container hours-layout">
      <div>${head(content.hoursIntro.kicker, content.hoursIntro.title, content.hoursIntro.note)}</div>
      <div class="hours">
        ${content.hours.map((hour) => {
      const current = hour.day.toLowerCase() === today;
      return `<div class="hour${hour.closed ? " closed" : ""}${current ? " today" : ""}">
              <span>${esc(hour.day)}${current ? `<em>Aujourd'hui</em>` : ""}</span>
              <strong>${esc(hour.closed ? "Ferm\xE9" : hour.hours)}</strong>
            </div>`;
    }).join("")}
      </div>
    </div>
  </section>`;
  }
  function renderFaq(content) {
    if (!content.faq.length) return "";
    return `<section class="section" id="questions">
    <div class="container faq-layout">
      <div>${head(content.faqIntro.kicker, content.faqIntro.title)}</div>
      <div class="faq">
        ${content.faq.map(
      (item) => `<article class="faq-item">
            <button type="button" aria-expanded="false">
              <span>${esc(item.question)}</span>
              <i aria-hidden="true"></i>
            </button>
            <div class="faq-a"><div><p>${rich(item.answer)}</p></div></div>
          </article>`
    ).join("")}
      </div>
    </div>
  </section>`;
  }
  function renderBooking(content, phoneLink) {
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
        ${paused ? `<div class="pause">${rich(content.booking.pauseMessage)}</div>` : `<form id="booking-form">
            <div class="hp" aria-hidden="true"><label>Soci\xE9t\xE9<input name="company" tabindex="-1" autocomplete="off" /></label></div>
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
              <label class="field full">${esc(labels.message)}<textarea name="message" rows="4" maxlength="1000" placeholder="V\xE9hicule, entr\xE9e, pr\xE9cisions..."></textarea></label>
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
          </div>`}
      </div>
    </div>
  </section>`;
  }

  // src/browserRender.ts
  var target = globalThis;
  target.renderLaCoche = (content) => renderPublic(content, new URL("https://lacoche.local/"));
  target.normalizeLaCoche = normalizeContent;
})();
