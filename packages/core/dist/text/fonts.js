import { DEFAULT_FONT_FAMILY, IS_BROWSER } from "../constants.js";
import { fontFallbackEntry } from "./fallbacks.js";
import { FONT_WEIGHT_NAMES, chooseLocalFontMatch, isVariableFont, normalizeFontFamily, styleToVariant, styleToWeight, weightToFigmaStyle, weightToStyle } from "./font-style.js";
import { collectGraphFontKeys } from "./requirements.js";
import { WebFontResolver, normalizedCoverageText } from "./web-fonts.js";
//#region src/text/fonts.ts
const BUNDLED_FONTS = {
	"Inter|Regular": "/Inter-Regular.ttf",
	"Inter|Medium": "/Inter-Medium.ttf",
	"Inter|SemiBold": "/Inter-SemiBold.ttf",
	"Inter|Bold": "/Inter-Bold.ttf",
	"Inter|ExtraBold": "/Inter-ExtraBold.ttf",
	"Noto Naskh Arabic|Regular": "/NotoNaskhArabic-Regular.ttf"
};
var FontManager = class {
	loadedFamilies = /* @__PURE__ */ new Map();
	supplementalFamilyData = /* @__PURE__ */ new Map();
	remoteCoverage = /* @__PURE__ */ new Map();
	blockedNodeIds = /* @__PURE__ */ new Set();
	fontProvider = null;
	fontProviders = /* @__PURE__ */ new Set();
	registrationGeneration = 0;
	providerRegistrations = /* @__PURE__ */ new WeakMap();
	localFonts = null;
	localFontAccessState = IS_BROWSER ? "prompt" : "unsupported";
	downloadedFontCache = null;
	fallbackUserAgent;
	hostFontLoader = null;
	webFonts = new WebFontResolver();
	cjkFallbackFamilies = [];
	cjkFallbackPromise = null;
	arabicFallbackFamilies = [];
	arabicFallbackPromise = null;
	attachProvider(_canvasKit, provider) {
		this.fontProviders.add(provider);
		this.fontProvider = provider;
		this.providerRegistrations.set(provider, /* @__PURE__ */ new Map());
		this.registrationGeneration++;
		for (const [cacheKey, data] of this.loadedFamilies) {
			const separator = cacheKey.indexOf("|");
			const family = cacheKey.slice(0, separator);
			this.registerFontInProvider(provider, family, data);
			for (const supplemental of this.supplementalFamilyData.get(cacheKey) ?? []) this.registerFontInProvider(provider, family, supplemental);
		}
	}
	detachProvider(provider) {
		if (!provider) {
			this.fontProviders.clear();
			this.fontProvider = null;
			this.providerRegistrations = /* @__PURE__ */ new WeakMap();
			return;
		}
		this.fontProviders.delete(provider);
		this.providerRegistrations.delete(provider);
		if (this.fontProvider === provider) this.fontProvider = Array.from(this.fontProviders).at(-1) ?? null;
	}
	provider() {
		return this.fontProvider;
	}
	generation() {
		return this.registrationGeneration;
	}
	blockNodesUntilFontsResolve(nodeIds) {
		for (const nodeId of nodeIds) this.blockedNodeIds.add(nodeId);
	}
	unblockNodes(nodeIds) {
		for (const nodeId of nodeIds) this.blockedNodeIds.delete(nodeId);
	}
	isNodeBlocked(nodeId) {
		return this.blockedNodeIds.has(nodeId);
	}
	localAccessState() {
		return this.localFontAccessState;
	}
	setDownloadedFontCache(cache) {
		this.downloadedFontCache = cache;
	}
	setFallbackUserAgent(userAgent) {
		this.fallbackUserAgent = userAgent;
	}
	setHostFontLoader(loader) {
		this.hostFontLoader = loader;
	}
	/** @deprecated Use setHostFontLoader. Scheduled for removal in v0.15. */
	setHostFallbackFontLoader(loader) {
		this.setHostFontLoader(loader);
	}
	setOnlineFontProviders(settings) {
		this.webFonts.setEnabled(settings);
	}
	setWebFontFetch(fetcher) {
		this.webFonts.setRemoteFetch(fetcher);
	}
	enabledOnlineFontProviders() {
		return this.webFonts.enabledProviders();
	}
	async loadCachedFont(family, style = "Regular", characters = "") {
		const cached = await this.readDownloadedFont(family, style, characters);
		if (!cached) return null;
		return this.registerAndCache(family, style, cached);
	}
	async requestLocalFontAccess() {
		if (!IS_BROWSER || !window.queryLocalFonts) {
			this.localFontAccessState = "unsupported";
			this.localFonts = [];
			return [];
		}
		try {
			const fonts = await window.queryLocalFonts();
			const seen = /* @__PURE__ */ new Set();
			const result = [];
			for (const f of fonts) {
				const key = `${f.family}|${f.style}`;
				if (seen.has(key)) continue;
				seen.add(key);
				result.push({
					family: f.family,
					fullName: f.fullName,
					style: f.style,
					postscriptName: f.postscriptName
				});
			}
			this.localFonts = result;
			this.localFontAccessState = "granted";
			return result;
		} catch {
			this.localFonts = [];
			this.localFontAccessState = "denied";
			return [];
		}
	}
	async listFamilies() {
		return (await this.listFamilyOptions()).map((option) => option.family);
	}
	async listFamilyOptions() {
		const fonts = this.localFonts ?? await this.requestLocalFontAccess();
		const webFontFamilies = await Promise.all(this.enabledOnlineFontProviders().map(async (provider) => ({
			provider,
			families: await this.webFonts.listFamilies(provider)
		})));
		const byFamily = /* @__PURE__ */ new Map();
		byFamily.set(DEFAULT_FONT_FAMILY, {
			family: DEFAULT_FONT_FAMILY,
			source: "bundled"
		});
		for (const { provider, families } of webFontFamilies) for (const family of families) if (!byFamily.has(family)) byFamily.set(family, {
			family,
			source: provider
		});
		for (const font of fonts) byFamily.set(font.family, {
			family: font.family,
			source: "local"
		});
		return [...byFamily.values()].sort((a, b) => a.family.localeCompare(b.family));
	}
	preloadWebFontFamilies() {
		this.webFonts.preloadFamilies();
	}
	preloadGoogleFamilies() {
		if (!this.webFonts.enabledProviders().includes("google")) return;
		this.webFonts.listFamilies("google");
	}
	async fetchBundledFont(url) {
		if (IS_BROWSER) return (await fetch(url)).arrayBuffer();
		const { readFile } = await import(
			/* @vite-ignore */
			"node:fs/promises"
);
		const { resolve, dirname } = await import(
			/* @vite-ignore */
			"node:path"
);
		const { fileURLToPath } = await import(
			/* @vite-ignore */
			"node:url"
);
		const buf = await readFile(resolve(dirname(fileURLToPath(import.meta.resolve("@open-pencil/core/package.json"))), `assets${url}`));
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	}
	async loadLocalFont(family, style = "Regular") {
		const cacheKey = `${family}|${style}`;
		const loaded = this.loadedFamilies.get(cacheKey);
		if (loaded) {
			this.registerFontInCanvasKit(family, loaded);
			return loaded;
		}
		const localBuffer = await this.loadHostFont(family, style) ?? await this.findLocalFont(family, style);
		if (localBuffer) return this.registerAndCache(family, style, localBuffer);
		const bundledURL = BUNDLED_FONTS[cacheKey];
		if (!bundledURL) return null;
		try {
			const buffer = await this.fetchBundledFont(bundledURL);
			return buffer && !isVariableFont(buffer) ? this.registerAndCache(family, style, buffer) : null;
		} catch (e) {
			console.warn(`Bundled font load failed for "${family}" ${style}:`, e);
			return null;
		}
	}
	async loadRemoteFont(family, style = "Regular", characters = "") {
		if (typeof fetch === "undefined") return null;
		const coverage = this.remoteCoverage.get(`${family}|${style}`);
		if (characters && coverage && Array.from(characters).every((character) => coverage.has(character))) return this.loadedData(family, style);
		try {
			const requestedCharacters = normalizedCoverageText(`${coverage ? Array.from(coverage).join("") : ""}${characters}`);
			const normalized = normalizeFontFamily(family);
			const families = normalized === family ? [family] : [family, normalized];
			const buffers = await this.webFonts.fetchFont(families, style, requestedCharacters);
			if (buffers.length === 0) return null;
			const primary = buffers[0];
			await this.writeDownloadedFont(family, style, primary, requestedCharacters);
			const registered = this.registerAndCache(family, style, primary);
			const loadedCoverage = this.remoteCoverage.get(`${family}|${style}`) ?? /* @__PURE__ */ new Set();
			for (const character of requestedCharacters) loadedCoverage.add(character);
			this.remoteCoverage.set(`${family}|${style}`, loadedCoverage);
			for (const supplemental of buffers.slice(1)) this.registerSupplemental(family, style, supplemental);
			return registered;
		} catch (e) {
			console.warn(`Web font fetch failed for "${family}" ${style}:`, e);
			return null;
		}
	}
	async loadFont(family, style = "Regular", characters = "") {
		const loaded = this.loadedData(family, style);
		if (loaded) {
			this.registerFontInCanvasKit(family, loaded);
			const remoteCoverage = this.remoteCoverage.get(`${family}|${style}`);
			return Boolean(characters && remoteCoverage && Array.from(characters).some((character) => !remoteCoverage.has(character))) ? await this.loadRemoteFont(family, style, characters) ?? loaded : loaded;
		}
		return await this.loadLocalFont(family, style) ?? await this.loadCachedFont(family, style, characters) ?? await this.loadRemoteFont(family, style, characters);
	}
	async ensureNodeFont(family, weight) {
		await this.loadFont(family, weightToStyle(weight));
	}
	markLoaded(family, style, data) {
		this.registerAndCache(family, style, data);
	}
	isLoaded(family) {
		return [...this.loadedFamilies.keys()].some((k) => k.startsWith(`${family}|`));
	}
	isStyleLoaded(family, style) {
		return this.loadedFamilies.has(`${family}|${style}`);
	}
	remoteStyleNeedsCoverage(family, style, characters) {
		const coverage = this.remoteCoverage.get(`${family}|${style}`);
		return !!coverage && characters.some((character) => !coverage.has(character));
	}
	loadedData(family, style) {
		return this.loadedFamilies.get(`${family}|${style}`) ?? null;
	}
	renderFamily(family, _style) {
		return family;
	}
	collectFontKeys(graph, nodeIds) {
		return collectGraphFontKeys(graph, nodeIds);
	}
	async ensureCJKFallback() {
		if (this.cjkFallbackFamilies.length > 0) return this.cjkFallbackFamilies;
		if (this.cjkFallbackPromise) return this.cjkFallbackPromise;
		this.cjkFallbackPromise = this.ensureFallbackFamilies("cjk", this.cjkFallbackFamilies, { allowVariableLocalFonts: true });
		return this.cjkFallbackPromise;
	}
	getCJKFallbackFamilies() {
		return this.cjkFallbackFamilies;
	}
	setCJKFallbackFamily(family) {
		if (!this.cjkFallbackFamilies.includes(family)) this.cjkFallbackFamilies.push(family);
	}
	async ensureArabicFallback() {
		if (this.arabicFallbackFamilies.length > 0) return this.arabicFallbackFamilies;
		if (this.arabicFallbackPromise) return this.arabicFallbackPromise;
		this.arabicFallbackPromise = this.ensureFallbackFamilies("arabic", this.arabicFallbackFamilies);
		return this.arabicFallbackPromise;
	}
	async ensureFallbackPack(scripts = ["cjk", "arabic"], characters = "") {
		const result = {};
		await Promise.all(scripts.map(async (script) => {
			if (script === "arabic" && !characters) result[script] = await this.ensureArabicFallback();
			else if (script === "cjk" && !characters) result[script] = await this.ensureCJKFallback();
			else {
				const target = script === "arabic" ? this.arabicFallbackFamilies : this.cjkFallbackFamilies;
				result[script] = await this.ensureFallbackFamilies(script, target, {}, characters);
			}
		}));
		return result;
	}
	getArabicFallbackFamilies() {
		return this.arabicFallbackFamilies;
	}
	setArabicFallbackFamily(family) {
		if (!this.arabicFallbackFamilies.includes(family)) this.arabicFallbackFamilies.push(family);
	}
	async ensureFallbackFamilies(script, targetFamilies, options = {}, characters = "") {
		const manifest = fontFallbackEntry(script, this.fallbackUserAgent);
		for (const family of manifest.localFamilies) {
			const buffer = await this.loadHostFont(family, "Regular") ?? await this.findLocalFont(family, void 0, { allowVariable: options.allowVariableLocalFonts });
			if (buffer && this.registerAndCache(family, "Regular", buffer) && !targetFamilies.includes(family)) targetFamilies.push(family);
		}
		if (targetFamilies.length === 0 || characters) {
			const results = await Promise.allSettled(manifest.remoteFamilies.map(async (family) => {
				return await this.loadRemoteFont(family, "Regular", characters) ? family : null;
			}));
			for (const result of results) if (result.status === "fulfilled" && result.value && !targetFamilies.includes(result.value)) targetFamilies.push(result.value);
		}
		return targetFamilies;
	}
	async loadHostFont(family, style) {
		if (!this.hostFontLoader) return null;
		try {
			return await this.hostFontLoader(family, style);
		} catch (e) {
			console.warn(`Host fallback font load failed for "${family}" ${style}:`, e);
			return null;
		}
	}
	async readDownloadedFont(family, style, characters = "") {
		if (!this.downloadedFontCache) return null;
		try {
			return await this.downloadedFontCache.read(family, style, characters);
		} catch (e) {
			console.warn(`Downloaded font cache read failed for "${family}" ${style}:`, e);
			return null;
		}
	}
	async writeDownloadedFont(family, style, data, characters = "") {
		if (!this.downloadedFontCache) return;
		try {
			await this.downloadedFontCache.write(family, style, data, characters);
		} catch (e) {
			console.warn(`Downloaded font cache write failed for "${family}" ${style}:`, e);
		}
	}
	async findLocalFont(family, style, options = {}) {
		if (!IS_BROWSER || !window.queryLocalFonts) return null;
		if (this.localFontAccessState !== "granted") return null;
		try {
			const match = chooseLocalFontMatch(await window.queryLocalFonts(), family, style);
			if (!match) return null;
			const buffer = await (await match.blob()).arrayBuffer();
			if (!options.allowVariable && isVariableFont(buffer)) return null;
			return buffer;
		} catch (e) {
			console.warn(`Local font access failed for "${family}" ${style ?? ""}:`, e);
			return null;
		}
	}
	registerSupplemental(family, style, buffer) {
		const key = `${family}|${style}`;
		const supplemental = this.supplementalFamilyData.get(key) ?? [];
		if (supplemental.includes(buffer)) return;
		supplemental.push(buffer);
		this.supplementalFamilyData.set(key, supplemental);
		this.registerFontInCanvasKit(family, buffer);
		this.registerFontInBrowser(family, style, buffer);
	}
	registerAndCache(family, style, buffer) {
		const key = `${family}|${style}`;
		const existing = this.loadedFamilies.get(key);
		if (existing === buffer) {
			this.registerFontInCanvasKit(family, buffer);
			return buffer;
		}
		if (existing) this.registerSupplemental(family, style, existing);
		this.loadedFamilies.set(key, buffer);
		this.registerFontInCanvasKit(family, buffer);
		this.registerFontInBrowser(family, style, buffer);
		return buffer;
	}
	registerFontInCanvasKit(family, data) {
		let registered = false;
		for (const provider of this.fontProviders) registered = this.registerFontInProvider(provider, family, data) || registered;
		return registered;
	}
	registerFontInProvider(provider, family, data) {
		if (data.byteLength < 4) return false;
		const registrations = this.providerRegistrations.get(provider) ?? /* @__PURE__ */ new Map();
		const registeredData = registrations.get(family);
		if (registeredData?.has(data)) return true;
		try {
			provider.registerFont(data, family);
			const familyRegistrations = registeredData ?? /* @__PURE__ */ new Set();
			familyRegistrations.add(data);
			registrations.set(family, familyRegistrations);
			this.providerRegistrations.set(provider, registrations);
			this.registrationGeneration++;
			return true;
		} catch {
			return false;
		}
	}
	registerFontInBrowser(family, style, data) {
		if (!IS_BROWSER) return;
		const weight = styleToWeight(style);
		const italic = style.toLowerCase().includes("italic") ? "italic" : "normal";
		const face = new FontFace(family, data, {
			weight: String(weight),
			style: italic
		});
		face.load().then(() => document.fonts.add(face)).catch(() => {
			console.warn(`Failed to load font "${family}" (${style})`);
		});
	}
};
const fontManager = new FontManager();
//#endregion
export { FONT_WEIGHT_NAMES, FontManager, chooseLocalFontMatch, fontManager, isVariableFont, normalizeFontFamily, styleToVariant, styleToWeight, weightToFigmaStyle, weightToStyle };

//# sourceMappingURL=fonts.js.map