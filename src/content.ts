import { bool, idOf, isObj, optionalStr, safeUrl, str, uniqueIds } from "./util";

export const MOTIFS = ["eau", "cuir", "chrome", "bac", "jantes", "nuit"] as const;
export type Motif = (typeof MOTIFS)[number];

export const SECTION_IDS = [
	"about",
	"services",
	"zones",
	"steps",
	"gallery",
	"quote",
	"testimonials",
	"hours",
	"faq",
	"booking",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export type Availability = "disponible" | "indisponible";
export type BusinessState = "ouvert" | "complet" | "ferme";

export interface StatItem {
	id: string;
	value: string;
	label: string;
}

export interface PointItem {
	id: string;
	title: string;
	text: string;
}

export interface ServiceItem {
	id: string;
	name: string;
	category: string;
	description: string;
	price: string;
	duration: string;
	availability: Availability;
	featured: boolean;
}

export interface ZoneItem {
	id: string;
	name: string;
	area: string;
	description: string;
	availability: Availability;
}

export interface HourItem {
	id: string;
	day: string;
	hours: string;
	closed: boolean;
}

export interface StepItem {
	id: string;
	title: string;
	text: string;
}

export interface GalleryItem {
	id: string;
	title: string;
	caption: string;
	imageUrl: string;
	motif: Motif;
	visible: boolean;
}

export interface Testimonial {
	id: string;
	name: string;
	area: string;
	text: string;
	stars: number;
	visible: boolean;
}

export interface FaqItem {
	id: string;
	question: string;
	answer: string;
}

export interface SiteContent {
	seo: { title: string; description: string };
	brand: {
		name: string;
		shortName: string;
		tagline: string;
		phone: string;
		phoneDisplay: string;
		instagram: string;
		email: string;
		logoUrl: string;
	};
	nav: {
		about: string;
		services: string;
		zones: string;
		gallery: string;
		testimonials: string;
		booking: string;
	};
	announcement: { enabled: boolean; text: string };
	status: { state: BusinessState; message: string };
	hero: {
		kicker: string;
		title: string;
		highlight: string;
		subtitle: string;
		primaryCta: string;
		secondaryCta: string;
		note: string;
	};
	marquee: string[];
	stats: StatItem[];
	about: {
		kicker: string;
		title: string;
		text: string;
		points: PointItem[];
	};
	servicesIntro: { kicker: string; title: string; text: string };
	services: ServiceItem[];
	zonesIntro: { kicker: string; title: string; text: string };
	zones: ZoneItem[];
	stepsIntro: { kicker: string; title: string; text: string };
	steps: StepItem[];
	galleryIntro: { kicker: string; title: string; text: string };
	gallery: GalleryItem[];
	quote: { text: string; by: string };
	testimonialsIntro: { kicker: string; title: string; text: string };
	testimonials: Testimonial[];
	hoursIntro: { kicker: string; title: string; note: string };
	hours: HourItem[];
	faqIntro: { kicker: string; title: string };
	faq: FaqItem[];
	booking: {
		enabled: boolean;
		kicker: string;
		title: string;
		text: string;
		submitLabel: string;
		successTitle: string;
		successText: string;
		pauseMessage: string;
		disclaimer: string;
		labels: {
			name: string;
			phone: string;
			email: string;
			service: string;
			zone: string;
			date: string;
			message: string;
		};
	};
	footer: { blurb: string; note: string };
	sections: Record<SectionId, boolean>;
	sectionOrder: SectionId[];
	internalNote: string;
}

export const defaultContent: SiteContent = {
	seo: {
		title: "La Coche Esthétique Auto | Lavage mobile",
		description:
			"Esthétique automobile mobile à Bellefeuille, Lac-Paul et Mirabel-Nord. Lavage intérieur, extérieur et lavage de bac. 450-523-5538.",
	},
	brand: {
		name: "La Coche Esthétique Auto",
		shortName: "La Coche",
		tagline: "Esthétique auto & lavage de bac",
		phone: "+14505235538",
		phoneDisplay: "450-523-5538",
		instagram: "@la.coche.estetique",
		email: "",
		logoUrl: "/logo.png",
	},
	nav: {
		about: "Atelier",
		services: "Soins",
		zones: "Secteurs",
		gallery: "Galerie",
		testimonials: "Avis",
		booking: "Réserver",
	},
	announcement: {
		enabled: true,
		text: "Service mobile — on se déplace chez vous, dans votre entrée.",
	},
	status: {
		state: "ouvert",
		message: "Disponible pour des rendez-vous",
	},
	hero: {
		kicker: "Bellefeuille · Lac-Paul · Mirabel-Nord",
		title: "L'éclat, livré",
		highlight: "dans votre entrée.",
		subtitle:
			"La Coche, c'est l'esthétique auto qui vient à vous. Lavage soigné, intérieur détaillé et bac de camion propre — sans que vous ayez à vous déplacer.",
		primaryCta: "Réserver un soin",
		secondaryCta: "Voir les soins",
		note: "Un appel, un message Instagram, ou le formulaire. On confirme le créneau avec vous.",
	},
	marquee: [
		"Esthétique auto",
		"Lavage de bac",
		"Service mobile",
		"Bellefeuille",
		"Lac-Paul",
		"Mirabel-Nord",
		"Intérieur soigné",
		"Finition brillante",
	],
	stats: [
		{ id: "stat-secteurs", value: "3", label: "secteurs desservis" },
		{ id: "stat-focus", value: "1", label: "auto à la fois" },
		{ id: "stat-bac", value: "Bac", label: "de pickup soigné" },
		{ id: "stat-mobile", value: "Mobile", label: "on vient chez vous" },
	],
	about: {
		kicker: "L'atelier mobile",
		title: "Une auto nette, sans la file d'attente.",
		text: "On travaille à la main, un véhicule à la fois. Produits adaptés à la peinture et à l'habitacle, finition nette, et le respect de votre horaire. Vous restez chez vous. On s'occupe du reste.",
		points: [
			{
				id: "pt-deplace",
				title: "On se déplace",
				text: "Bellefeuille, Lac-Paul et Mirabel-Nord, directement à votre adresse.",
			},
			{
				id: "pt-temps",
				title: "Un véhicule à la fois",
				text: "Pas de tunnel, pas de rush. Chaque auto a le temps qu'il faut.",
			},
			{
				id: "pt-bac",
				title: "Le bac, vraiment",
				text: "Le lavage de bac de pickup fait partie de la maison, pas d'un extra oublié.",
			},
			{
				id: "pt-rdv",
				title: "Rendez-vous simple",
				text: "Un message, un appel, un créneau. On confirme avant de passer.",
			},
		],
	},
	servicesIntro: {
		kicker: "Les soins",
		title: "Choisissez le niveau de fini.",
		text: "Les prix indiqués sont un point de départ. On confirme le tarif exact selon l'état du véhicule, avant la visite.",
	},
	services: [
		{
			id: "svc-exterieur",
			name: "Lavage extérieur signature",
			category: "Extérieur",
			description:
				"Lavage à la main, jantes comprises, séchage sans traces et une finition qui accroche la lumière.",
			price: "Dès 49 $",
			duration: "45 min",
			availability: "disponible",
			featured: false,
		},
		{
			id: "svc-interieur",
			name: "Intérieur complet",
			category: "Intérieur",
			description:
				"Aspiration en profondeur, plastiques, vitres intérieures, coffre et une habitacle remise en ordre.",
			price: "Dès 79 $",
			duration: "75 min",
			availability: "disponible",
			featured: false,
		},
		{
			id: "svc-combo",
			name: "Combo signature",
			category: "Complet",
			description: "Extérieur et intérieur dans la même visite. L'auto repart vraiment nette, pas juste rincée.",
			price: "Dès 119 $",
			duration: "2 h",
			availability: "disponible",
			featured: true,
		},
		{
			id: "svc-bac",
			name: "Lavage de bac",
			category: "Bac",
			description:
				"Le bac de pickup vidé du gros, lavé et rincé. Boue, sel d'hiver et poussière de chantier.",
			price: "Dès 59 $",
			duration: "40 min",
			availability: "disponible",
			featured: true,
		},
		{
			id: "svc-cire",
			name: "Cire de protection",
			category: "Protection",
			description: "Une couche de cire pour l'éclat et une meilleure tenue face à la pluie et à la route.",
			price: "Dès 69 $",
			duration: "30 min",
			availability: "disponible",
			featured: false,
		},
		{
			id: "svc-sièges",
			name: "Shampooing des sièges",
			category: "Intérieur",
			description: "Tissus ou tapis : on lève les taches du quotidien et on rafraîchit l'habitacle.",
			price: "Dès 89 $",
			duration: "90 min",
			availability: "disponible",
			featured: false,
		},
		{
			id: "svc-jantes",
			name: "Jantes & pneus",
			category: "Extérieur",
			description: "Décontamination des jantes et pneus nourris. Le détail qu'on voit en premier.",
			price: "Dès 35 $",
			duration: "25 min",
			availability: "disponible",
			featured: false,
		},
		{
			id: "svc-detail",
			name: "Détailing complet",
			category: "Complet",
			description: "Le grand soin : intérieur, extérieur, protection et les finitions qu'on ne bâcle pas.",
			price: "Dès 199 $",
			duration: "3 h",
			availability: "disponible",
			featured: false,
		},
	],
	zonesIntro: {
		kicker: "Secteurs",
		title: "On vient à vous.",
		text: "Trois secteurs, le même soin. Si votre adresse est juste à côté, écrivez-nous quand même.",
	},
	zones: [
		{
			id: "zone-bellefeuille",
			name: "Bellefeuille",
			area: "Saint-Jérôme",
			description: "Service mobile dans Bellefeuille, directement dans votre entrée.",
			availability: "disponible",
		},
		{
			id: "zone-lacpaul",
			name: "Lac-Paul",
			area: "Laurentides",
			description: "On se déplace dans le secteur Lac-Paul, sur rendez-vous.",
			availability: "disponible",
		},
		{
			id: "zone-mirabel",
			name: "Mirabel-Nord",
			area: "Mirabel",
			description: "Esthétique auto à domicile dans Mirabel-Nord.",
			availability: "disponible",
		},
	],
	stepsIntro: {
		kicker: "La démarche",
		title: "Quatre étapes, zéro déplacement pour vous.",
		text: "De la demande à l'auto qui sèche au soleil dans votre cour.",
	},
	steps: [
		{
			id: "step-1",
			title: "Vous écrivez",
			text: "Un appel, un texto, Instagram ou le formulaire. Le soin, le secteur, le moment.",
		},
		{
			id: "step-2",
			title: "On confirme",
			text: "On vous revient avec un créneau clair et le prix confirmé avant de se déplacer.",
		},
		{
			id: "step-3",
			title: "On se déplace",
			text: "L'atelier vient à vous. On arrive équipés, prêts à travailler sur place.",
		},
		{
			id: "step-4",
			title: "Vous profitez",
			text: "Une auto fraîche. Vous, vous n'avez pas fait la file.",
		},
	],
	galleryIntro: {
		kicker: "Le fini",
		title: "Ce qu'on laisse derrière nous.",
		text: "De l'eau, du temps, et une auto qui a l'air de sortir de quelque part de mieux qu'un tunnel.",
	},
	gallery: [
		{
			id: "gal-chrome",
			title: "Finition miroir",
			caption: "L'extérieur, lavé et séché à la main.",
			imageUrl: "",
			motif: "chrome",
			visible: true,
		},
		{
			id: "gal-cuir",
			title: "Habitacle net",
			caption: "Aspiration, plastiques, vitres.",
			imageUrl: "",
			motif: "cuir",
			visible: true,
		},
		{
			id: "gal-bac",
			title: "Bac de pickup",
			caption: "Vidé, lavé, rincé.",
			imageUrl: "",
			motif: "bac",
			visible: true,
		},
		{
			id: "gal-eau",
			title: "Eau & mousse",
			caption: "Un lavage patient, pas une douche rapide.",
			imageUrl: "",
			motif: "eau",
			visible: true,
		},
		{
			id: "gal-jantes",
			title: "Jantes",
			caption: "Le détail qu'on remarque en premier.",
			imageUrl: "",
			motif: "jantes",
			visible: true,
		},
		{
			id: "gal-nuit",
			title: "Sous les lumières",
			caption: "La brillance, le soir venu.",
			imageUrl: "",
			motif: "nuit",
			visible: true,
		},
	],
	quote: {
		text: "Pas un tunnel. Pas une file. Juste votre auto, et le temps de bien la faire.",
		by: "La Coche",
	},
	testimonialsIntro: {
		kicker: "Ils en parlent",
		title: "Le genre de retour qu'on vise.",
		text: "Une visite à la maison, un bac propre, un intérieur qui sent le frais. C'est ça, le standard.",
	},
	testimonials: [
		{
			id: "avis-1",
			name: "Client",
			area: "Bellefeuille",
			text: "Ils sont venus dans l'entrée. Le bac de mon pickup n'avait pas été aussi propre depuis longtemps.",
			stars: 5,
			visible: true,
		},
		{
			id: "avis-2",
			name: "Client",
			area: "Mirabel-Nord",
			text: "Prise de rendez-vous simple, travail soigné, et je n'ai pas attendu dans un lave-auto.",
			stars: 5,
			visible: true,
		},
		{
			id: "avis-3",
			name: "Client",
			area: "Lac-Paul",
			text: "L'intérieur sent le propre, pas un parfum chimique. C'est exactement ce que je voulais.",
			stars: 5,
			visible: true,
		},
	],
	hoursIntro: {
		kicker: "Horaires",
		title: "Sur rendez-vous.",
		note: "Ces heures sont celles où on prend les rendez-vous. Le soin se fait chez vous.",
	},
	hours: [
		{ id: "hour-lun", day: "Lundi", hours: "Fermé", closed: true },
		{ id: "hour-mar", day: "Mardi", hours: "8 h – 18 h", closed: false },
		{ id: "hour-mer", day: "Mercredi", hours: "8 h – 18 h", closed: false },
		{ id: "hour-jeu", day: "Jeudi", hours: "8 h – 18 h", closed: false },
		{ id: "hour-ven", day: "Vendredi", hours: "8 h – 18 h", closed: false },
		{ id: "hour-sam", day: "Samedi", hours: "8 h – 17 h", closed: false },
		{ id: "hour-dim", day: "Dimanche", hours: "Sur demande", closed: false },
	],
	faqIntro: {
		kicker: "Questions",
		title: "Avant de nous écrire.",
	},
	faq: [
		{
			id: "faq-ou",
			question: "Vous vous déplacez vraiment?",
			answer:
				"Oui. On couvre Bellefeuille, Lac-Paul et Mirabel-Nord. Si votre adresse est limite, écrivez-nous, on vous dit oui ou non clairement.",
		},
		{
			id: "faq-la",
			question: "Faut-il que je sois sur place?",
			answer:
				"Idéalement oui, pour l'accès au véhicule. On confirme les détails — eau, entrée, stationnement — en prenant le rendez-vous.",
		},
		{
			id: "faq-eau",
			question: "Vous avez besoin d'eau ou d'électricité?",
			answer:
				"On arrive avec le matériel. Un accès à l'eau est utile pour certains soins. On vous le dit avant, jamais à la dernière minute.",
		},
		{
			id: "faq-bac",
			question: "Le lavage de bac, ça inclut quoi?",
			answer:
				"On retire le gros, on lave et on rince le bac de pickup. S'il reste un chargement à enlever, dites-le en réservant.",
		},
		{
			id: "faq-prix",
			question: "Comment je paie, et le prix est-il fixe?",
			answer:
				"On confirme le prix avant la visite, selon l'état de l'auto. Le paiement se fait au rendez-vous.",
		},
		{
			id: "faq-off",
			question: "Et si un soin est marqué indisponible?",
			answer:
				"Il reste visible pour que vous sachiez qu'on l'offre, mais il ne peut pas être réservé tant qu'on ne le rouvre pas.",
		},
	],
	booking: {
		enabled: true,
		kicker: "Rendez-vous",
		title: "Dites-nous quand on passe.",
		text: "Envoyez la demande. On vous répond par téléphone pour confirmer le soin, le secteur et l'heure.",
		submitLabel: "Envoyer la demande",
		successTitle: "Demande reçue.",
		successText: "On vous rappelle bientôt pour confirmer. Si c'est urgent, appelez directement.",
		pauseMessage: "Les demandes en ligne sont en pause. Appelez-nous ou écrivez sur Instagram.",
		disclaimer: "La demande n'est pas une confirmation. On vous rappelle pour bloquer le créneau.",
		labels: {
			name: "Nom",
			phone: "Téléphone",
			email: "Courriel",
			service: "Soin",
			zone: "Secteur",
			date: "Date souhaitée",
			message: "Détails",
		},
	},
	footer: {
		blurb: "Esthétique automobile mobile. On lave, on détaille et on remet votre bac à neuf — chez vous.",
		note: "La Coche Esthétique Auto · Service sur rendez-vous",
	},
	sections: {
		about: true,
		services: true,
		zones: true,
		steps: true,
		gallery: true,
		quote: true,
		testimonials: true,
		hours: true,
		faq: true,
		booking: true,
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
		"booking",
	],
	internalNote: "Ajustez les prix et remplacez les avis d'exemple avant de partager le site.",
};

function availability(value: unknown, fallback: Availability): Availability {
	return value === "disponible" || value === "indisponible" ? value : fallback;
}

function motifOf(value: unknown, fallback: Motif): Motif {
	return MOTIFS.includes(value as Motif) ? (value as Motif) : fallback;
}

function starsOf(value: unknown): number {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) return 5;
	return Math.max(1, Math.min(5, Math.round(n)));
}

export function normalizeContent(input: unknown): SiteContent {
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
		(Object.keys(base.nav) as (keyof SiteContent["nav"])[]).forEach((key) => {
			base.nav[key] = str(nav[key], base.nav[key], 32);
		});
	}
	if (isObj(src.announcement)) {
		base.announcement.enabled = bool(src.announcement.enabled, base.announcement.enabled);
		base.announcement.text = str(src.announcement.text, base.announcement.text, 180);
	}
	if (isObj(src.status)) {
		const state = src.status.state;
		base.status.state = state === "ouvert" || state === "complet" || state === "ferme" ? state : "ouvert";
		base.status.message = str(src.status.message, base.status.message, 160);
	}
	if (isObj(src.hero)) {
		base.hero.kicker = str(src.hero.kicker, base.hero.kicker, 120);
		base.hero.title = str(src.hero.title, base.hero.title, 80);
		base.hero.highlight = str(src.hero.highlight, base.hero.highlight, 80);
		base.hero.subtitle = str(src.hero.subtitle, base.hero.subtitle, 400);
		base.hero.primaryCta = str(src.hero.primaryCta, base.hero.primaryCta, 40);
		base.hero.secondaryCta = str(src.hero.secondaryCta, base.hero.secondaryCta, 40);
		base.hero.note = str(src.hero.note, base.hero.note, 220);
	}
	if (Array.isArray(src.marquee)) {
		const lines = src.marquee
			.filter((item): item is string => typeof item === "string")
			.map((item) => item.trim())
			.filter(Boolean)
			.slice(0, 24)
			.map((item) => item.slice(0, 48));
		if (lines.length) base.marquee = lines;
	}
	base.stats = normalizeStats(src.stats, base.stats);
	if (isObj(src.about)) {
		base.about.kicker = str(src.about.kicker, base.about.kicker, 60);
		base.about.title = str(src.about.title, base.about.title, 120);
		base.about.text = str(src.about.text, base.about.text, 800);
		base.about.points = normalizePoints(src.about.points, base.about.points);
	}
	if (isObj(src.servicesIntro)) {
		base.servicesIntro.kicker = str(src.servicesIntro.kicker, base.servicesIntro.kicker, 60);
		base.servicesIntro.title = str(src.servicesIntro.title, base.servicesIntro.title, 120);
		base.servicesIntro.text = str(src.servicesIntro.text, base.servicesIntro.text, 400);
	}
	base.services = normalizeServices(src.services, base.services);
	if (isObj(src.zonesIntro)) {
		base.zonesIntro.kicker = str(src.zonesIntro.kicker, base.zonesIntro.kicker, 60);
		base.zonesIntro.title = str(src.zonesIntro.title, base.zonesIntro.title, 120);
		base.zonesIntro.text = str(src.zonesIntro.text, base.zonesIntro.text, 400);
	}
	base.zones = normalizeZones(src.zones, base.zones);
	if (isObj(src.stepsIntro)) {
		base.stepsIntro.kicker = str(src.stepsIntro.kicker, base.stepsIntro.kicker, 60);
		base.stepsIntro.title = str(src.stepsIntro.title, base.stepsIntro.title, 140);
		base.stepsIntro.text = str(src.stepsIntro.text, base.stepsIntro.text, 400);
	}
	base.steps = normalizeSteps(src.steps, base.steps);
	if (isObj(src.galleryIntro)) {
		base.galleryIntro.kicker = str(src.galleryIntro.kicker, base.galleryIntro.kicker, 60);
		base.galleryIntro.title = str(src.galleryIntro.title, base.galleryIntro.title, 140);
		base.galleryIntro.text = str(src.galleryIntro.text, base.galleryIntro.text, 400);
	}
	base.gallery = normalizeGallery(src.gallery, base.gallery);
	if (isObj(src.quote)) {
		base.quote.text = str(src.quote.text, base.quote.text, 280);
		base.quote.by = str(src.quote.by, base.quote.by, 60);
	}
	if (isObj(src.testimonialsIntro)) {
		base.testimonialsIntro.kicker = str(src.testimonialsIntro.kicker, base.testimonialsIntro.kicker, 60);
		base.testimonialsIntro.title = str(src.testimonialsIntro.title, base.testimonialsIntro.title, 140);
		base.testimonialsIntro.text = str(src.testimonialsIntro.text, base.testimonialsIntro.text, 400);
	}
	base.testimonials = normalizeTestimonials(src.testimonials, base.testimonials);
	if (isObj(src.hoursIntro)) {
		base.hoursIntro.kicker = str(src.hoursIntro.kicker, base.hoursIntro.kicker, 60);
		base.hoursIntro.title = str(src.hoursIntro.title, base.hoursIntro.title, 120);
		base.hoursIntro.note = str(src.hoursIntro.note, base.hoursIntro.note, 300);
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
		base.booking.text = str(src.booking.text, base.booking.text, 400);
		base.booking.submitLabel = str(src.booking.submitLabel, base.booking.submitLabel, 40);
		base.booking.successTitle = str(src.booking.successTitle, base.booking.successTitle, 80);
		base.booking.successText = str(src.booking.successText, base.booking.successText, 300);
		base.booking.pauseMessage = str(src.booking.pauseMessage, base.booking.pauseMessage, 300);
		base.booking.disclaimer = str(src.booking.disclaimer, base.booking.disclaimer, 240);
		if (isObj(src.booking.labels)) {
			const labels = src.booking.labels;
			(Object.keys(base.booking.labels) as (keyof SiteContent["booking"]["labels"])[]).forEach((key) => {
				base.booking.labels[key] = str(labels[key], base.booking.labels[key], 40);
			});
		}
	}
	if (isObj(src.footer)) {
		base.footer.blurb = str(src.footer.blurb, base.footer.blurb, 300);
		base.footer.note = str(src.footer.note, base.footer.note, 160);
	}
	if (isObj(src.sections)) {
		for (const id of SECTION_IDS) {
			base.sections[id] = bool(src.sections[id], base.sections[id]);
		}
	}
	if (Array.isArray(src.sectionOrder)) {
		const seen = new Set<SectionId>();
		const order: SectionId[] = [];
		for (const item of src.sectionOrder) {
			if (SECTION_IDS.includes(item as SectionId) && !seen.has(item as SectionId)) {
				seen.add(item as SectionId);
				order.push(item as SectionId);
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

function normalizeStats(input: unknown, fallback: StatItem[]): StatItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 8).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "stat", index),
				value: str(item.value, "—", 16),
				label: str(item.label, "Libellé", 48),
			},
		];
	});
	return uniqueIds(items, "stat");
}

function normalizePoints(input: unknown, fallback: PointItem[]): PointItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 8).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "pt", index),
				title: str(item.title, "Point", 60),
				text: str(item.text, "", 240),
			},
		];
	});
	return uniqueIds(items, "pt");
}

function normalizeServices(input: unknown, fallback: ServiceItem[]): ServiceItem[] {
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
				featured: bool(item.featured, false),
			},
		];
	});
	return uniqueIds(items, "svc");
}

function normalizeZones(input: unknown, fallback: ZoneItem[]): ZoneItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 16).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "zone", index),
				name: str(item.name, "Secteur", 48),
				area: optionalStr(item.area, 48),
				description: str(item.description, "", 300),
				availability: availability(item.availability, "disponible"),
			},
		];
	});
	return uniqueIds(items, "zone");
}

function normalizeHours(input: unknown, fallback: HourItem[]): HourItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 14).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "hour", index),
				day: str(item.day, "Jour", 24),
				hours: str(item.hours, "Sur demande", 40),
				closed: bool(item.closed, false),
			},
		];
	});
	return uniqueIds(items, "hour");
}

function normalizeSteps(input: unknown, fallback: StepItem[]): StepItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 8).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "step", index),
				title: str(item.title, "Étape", 60),
				text: str(item.text, "", 280),
			},
		];
	});
	return uniqueIds(items, "step");
}

function normalizeGallery(input: unknown, fallback: GalleryItem[]): GalleryItem[] {
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
				visible: bool(item.visible, true),
			},
		];
	});
	return uniqueIds(items, "gal");
}

function normalizeTestimonials(input: unknown, fallback: Testimonial[]): Testimonial[] {
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
				visible: bool(item.visible, true),
			},
		];
	});
	return uniqueIds(items, "avis");
}

function normalizeFaq(input: unknown, fallback: FaqItem[]): FaqItem[] {
	if (!Array.isArray(input)) return fallback;
	const items = input.slice(0, 24).flatMap((item, index) => {
		if (!isObj(item)) return [];
		return [
			{
				id: idOf(item.id, "faq", index),
				question: str(item.question, "Question", 160),
				answer: str(item.answer, "", 600),
			},
		];
	});
	return uniqueIds(items, "faq");
}
