import { IS_BROWSER } from "../constants.js";
import { parseFontStyle } from "./face.js";
import { createProviderUnifont, isRemoteFontSource } from "./web-font/providers.js";
//#region src/text/web-fonts.ts
const WEB_FONT_PROVIDER_IDS = [
	"google",
	"fontsource",
	"bunny",
	"fontshare"
];
const WEB_FONT_PROVIDER_LABELS = {
	google: "Google Fonts",
	fontsource: "Fontsource",
	bunny: "Bunny Fonts",
	fontshare: "Fontshare"
};
const DEFAULT_WEB_FONT_PROVIDER_SETTINGS = {
	google: true,
	fontsource: true,
	bunny: false,
	fontshare: false
};
const DEFAULT_WEB_FONT_SUBSETS = [
	"latin",
	"latin-ext",
	"vietnamese",
	"cyrillic",
	"cyrillic-ext",
	"greek",
	"greek-ext"
];
function normalizedCoverageText(text) {
	return Array.from(new Set(text)).sort().join("");
}
function webFontSubsetsForText(text) {
	const subsets = new Set(DEFAULT_WEB_FONT_SUBSETS);
	if (/\p{Script=Arabic}/u.test(text)) subsets.add("arabic");
	if (/\p{Script=Hangul}/u.test(text)) subsets.add("korean");
	if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) subsets.add("japanese");
	if (/\p{Script=Han}/u.test(text)) {
		subsets.add("chinese-simplified");
		subsets.add("chinese-traditional");
		subsets.add("japanese");
	}
	return [...subsets];
}
function preferredRemoteSource(face) {
	const sources = face.src.filter(isRemoteFontSource);
	return sources.find((source) => source.format === "truetype" || source.format === "ttf") ?? sources.find((source) => source.format === "opentype" || source.format === "otf") ?? sources.find((source) => source.format === "woff2") ?? sources.find((source) => source.format === "woff") ?? sources[0];
}
function resolvedRemoteFaces(result) {
	const candidates = result.fonts.flatMap((face) => {
		const source = preferredRemoteSource(face);
		return source ? [{
			source,
			init: face.meta?.init,
			priority: face.meta?.priority ?? 0
		}] : [];
	});
	const preferredPriority = Math.min(...candidates.map((candidate) => candidate.priority));
	const seen = /* @__PURE__ */ new Set();
	const faces = [];
	for (const candidate of candidates) {
		if (candidate.priority !== preferredPriority || seen.has(candidate.source.url)) continue;
		seen.add(candidate.source.url);
		faces.push({
			source: candidate.source,
			init: candidate.init
		});
	}
	return faces;
}
function isArrayBuffer(value) {
	return value !== null;
}
var WebFontResolver = class {
	enabled = new Set(WEB_FONT_PROVIDER_IDS.filter((provider) => DEFAULT_WEB_FONT_PROVIDER_SETTINGS[provider]));
	unifontPromises = /* @__PURE__ */ new Map();
	familiesCache = /* @__PURE__ */ new Map();
	familiesPromises = /* @__PURE__ */ new Map();
	failedFonts = /* @__PURE__ */ new Set();
	fontPromises = /* @__PURE__ */ new Map();
	remoteFetch = null;
	fetchProxyQueue = Promise.resolve();
	setEnabled(settings) {
		this.enabled = new Set(WEB_FONT_PROVIDER_IDS.filter((provider) => settings[provider] === true));
		this.failedFonts.clear();
	}
	setRemoteFetch(fetcher) {
		this.remoteFetch = fetcher;
		this.unifontPromises.clear();
		this.familiesPromises.clear();
		this.familiesCache.clear();
		this.failedFonts.clear();
	}
	enabledProviders() {
		return WEB_FONT_PROVIDER_IDS.filter((provider) => this.enabled.has(provider));
	}
	preloadFamilies() {
		if (IS_BROWSER && !this.remoteFetch) return;
		for (const provider of this.enabledProviders()) this.listFamilies(provider);
	}
	async listFamilies(provider) {
		const cached = this.familiesCache.get(provider);
		if (cached) return cached;
		let promise = this.familiesPromises.get(provider);
		if (!promise) {
			promise = this.loadFamilies(provider);
			this.familiesPromises.set(provider, promise);
		}
		return promise;
	}
	async fetchFont(families, style, characters = "") {
		const providers = this.enabledProviders();
		if (providers.length === 0 || IS_BROWSER && !this.remoteFetch) return [];
		for (const family of families) for (const provider of providers) {
			const buffers = await this.fetchFromProvider(family, style, provider, characters);
			if (buffers.length > 0) return buffers;
		}
		return [];
	}
	async withFetchProxy(operation) {
		if (!this.remoteFetch) return operation();
		const previous = this.fetchProxyQueue;
		let release;
		this.fetchProxyQueue = new Promise((resolve) => {
			release = () => resolve();
		});
		await previous;
		const originalFetch = globalThis.fetch;
		globalThis.fetch = ((input, init) => {
			const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
			if (url.startsWith("https://") || url.startsWith("http://")) return this.remoteFetch?.(url, init) ?? Promise.reject(/* @__PURE__ */ new TypeError("No font proxy fetcher"));
			return originalFetch(input, init);
		});
		try {
			return await operation();
		} finally {
			globalThis.fetch = originalFetch;
			release?.();
		}
	}
	async fetchRemote(url, init) {
		if (this.remoteFetch) return this.remoteFetch(url, init);
		return fetch(url, init);
	}
	async unifont(provider) {
		let promise = this.unifontPromises.get(provider);
		if (!promise) {
			promise = this.withFetchProxy(() => createProviderUnifont(provider));
			this.unifontPromises.set(provider, promise);
		}
		return promise;
	}
	async loadFamilies(provider) {
		if (typeof fetch === "undefined" || IS_BROWSER && !this.remoteFetch) return [];
		try {
			const unifont = await this.unifont(provider);
			const listedFamilies = await this.withFetchProxy(() => unifont.listFonts());
			const families = listedFamilies ? [...new Set(listedFamilies)].sort((a, b) => a.localeCompare(b)) : [];
			this.familiesCache.set(provider, families);
			return families;
		} catch {
			this.familiesCache.set(provider, []);
			return [];
		}
	}
	async fetchFromProvider(family, style, provider, characters) {
		const coverage = normalizedCoverageText(characters);
		const key = `${provider}|${family}|${style}|${coverage}`;
		if (this.failedFonts.has(key)) return [];
		let promise = this.fontPromises.get(key);
		if (!promise) {
			promise = this.loadFromProvider(family, style, provider, coverage);
			this.fontPromises.set(key, promise);
		}
		const result = await promise;
		this.fontPromises.delete(key);
		if (result.length === 0) this.failedFonts.add(key);
		return result;
	}
	async loadFromProvider(family, style, provider, characters) {
		try {
			const parsed = parseFontStyle(style);
			const unifont = await this.unifont(provider);
			const options = {
				weights: [String(parsed.weight)],
				styles: [parsed.italic ? "italic" : "normal"],
				formats: [
					"ttf",
					"otf",
					"woff2",
					"woff"
				],
				subsets: webFontSubsetsForText(characters),
				...provider === "google" && characters ? { options: { google: { experimental: { glyphs: [characters] } } } } : {}
			};
			const faces = resolvedRemoteFaces(await this.withFetchProxy(() => unifont.resolveFont(family, options)));
			return (await Promise.all(faces.map(async ({ source, init }) => {
				const response = await this.fetchRemote(source.url, init);
				return response.ok ? response.arrayBuffer() : null;
			}))).filter(isArrayBuffer);
		} catch {
			return [];
		}
	}
};
//#endregion
export { DEFAULT_WEB_FONT_PROVIDER_SETTINGS, WEB_FONT_PROVIDER_IDS, WEB_FONT_PROVIDER_LABELS, WebFontResolver, normalizedCoverageText, webFontSubsetsForText };

//# sourceMappingURL=web-fonts.js.map