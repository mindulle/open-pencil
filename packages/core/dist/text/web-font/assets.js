import { createProviderUnifont, isRemoteFontSource } from "./providers.js";
import { WEB_FONT_PROVIDER_IDS } from "../web-fonts.js";
//#region src/text/web-font/assets.ts
function fontAssetExtension(source) {
	if (source.format === "woff2") return "woff2";
	if (source.format === "woff") return "woff";
	if (source.format === "opentype" || source.format === "otf") return "otf";
	return "ttf";
}
function fontAssetFormat(source) {
	if (source.format === "woff2") return "woff2";
	if (source.format === "woff") return "woff";
	if (source.format === "opentype" || source.format === "otf") return "opentype";
	return "truetype";
}
function slugFontFamily(family) {
	let slug = "";
	let previousDash = false;
	for (const char of family.toLowerCase()) {
		const code = char.charCodeAt(0);
		if (code >= 97 && code <= 122 || code >= 48 && code <= 57) {
			slug += char;
			previousDash = false;
			continue;
		}
		if (slug.length > 0 && !previousDash) {
			slug += "-";
			previousDash = true;
		}
	}
	return slug.endsWith("-") ? slug.slice(0, -1) : slug;
}
async function resolveRemoteFontSource(family, request, provider) {
	const unifont = await createProviderUnifont(provider);
	const options = {
		weights: [String(request.weight)],
		styles: [request.style ?? "normal"],
		formats: [
			"woff2",
			"woff",
			"ttf"
		],
		subsets: ["latin"]
	};
	const result = await unifont.resolveFont(family, options);
	for (const face of result.fonts.toSorted((a, b) => (a.meta?.priority ?? 0) - (b.meta?.priority ?? 0))) {
		const source = face.src.find(isRemoteFontSource);
		if (source) return {
			source,
			face
		};
	}
}
async function exportWebFontFaceAssets({ fonts, providers = WEB_FONT_PROVIDER_IDS.slice(), assetBasePath = "assets/fonts", fetcher = fetch }) {
	const assets = [];
	const seen = /* @__PURE__ */ new Set();
	for (const request of fonts) {
		const family = request.family;
		const requestStyle = request.style ?? "normal";
		const key = `${family}|${request.weight}|${requestStyle}`;
		if (seen.has(key)) continue;
		seen.add(key);
		for (const provider of providers) try {
			const resolved = await resolveRemoteFontSource(family, request, provider);
			if (!resolved) continue;
			const response = await fetcher(resolved.source.url, resolved.face.meta?.init);
			if (!response.ok) continue;
			const extension = fontAssetExtension(resolved.source);
			const path = `${assetBasePath}/${slugFontFamily(family)}-${request.weight}-${requestStyle}.${extension}`;
			assets.push({
				family,
				weight: resolved.face.weight ?? request.weight,
				style: resolved.face.style ?? requestStyle,
				display: resolved.face.display,
				stretch: resolved.face.stretch,
				unicodeRange: resolved.face.unicodeRange,
				format: fontAssetFormat(resolved.source),
				path,
				content: new Uint8Array(await response.arrayBuffer())
			});
			break;
		} catch (error) {
			console.warn(`Failed to export ${family} from ${provider} fonts`, error);
		}
	}
	return { assets };
}
//#endregion
export { exportWebFontFaceAssets };

//# sourceMappingURL=assets.js.map