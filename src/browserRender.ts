import { normalizeContent, type SiteContent } from "./content";
import { renderPublic } from "./publicPage";

const target = globalThis as typeof globalThis & {
	renderLaCoche?: (content: SiteContent) => string;
	normalizeLaCoche?: (input: unknown) => SiteContent;
};

target.renderLaCoche = (content) => renderPublic(content, new URL("https://lacoche.local/"));
target.normalizeLaCoche = normalizeContent;
