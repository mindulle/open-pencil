import { fontManager } from "../fonts.js";
import { FontResolver } from "./resolver.js";
import { missingGlyphCharacters, missingGlyphScripts } from "./coverage.js";
//#region src/text/resolver/index.ts
function faceCandidate(family, style, source) {
	return {
		id: `${source}:${family}:${style}`,
		family,
		style,
		source
	};
}
function fontFaceDemand(family, style, characters = "") {
	return {
		key: `face:${family.trim().toLocaleLowerCase()}:${style.toLocaleLowerCase()}`,
		characters,
		candidates: [
			faceCandidate(family, style, "registered"),
			faceCandidate(family, style, "local"),
			faceCandidate(family, style, "cache"),
			faceCandidate(family, style, "remote")
		]
	};
}
function fontRemoteCoverageDemand(family, style, characters) {
	const coverageKey = [...new Set(characters)].sort((a, b) => a.localeCompare(b)).join("");
	return {
		key: `remote-coverage:${family.trim().toLocaleLowerCase()}:${style.toLocaleLowerCase()}:${coverageKey}`,
		characters: coverageKey,
		candidates: [faceCandidate(family, style, "remote")]
	};
}
function fontCoverageDemand(script, characters = []) {
	const codePoints = characters.flatMap((character) => {
		const codePoint = character.codePointAt(0);
		return codePoint === void 0 ? [] : [codePoint.toString(16)];
	});
	return {
		key: `coverage:${script}:${[...new Set(codePoints)].sort((a, b) => a.localeCompare(b)).join(",")}`,
		characters: characters.join(""),
		candidates: [{
			id: `fallback:${script}`,
			family: script,
			style: "Regular",
			source: "fallback"
		}]
	};
}
const productionFontLoader = async (candidate, demand) => {
	switch (candidate.source) {
		case "registered": return fontManager.isStyleLoaded(candidate.family, candidate.style);
		case "local": return await fontManager.loadLocalFont(candidate.family, candidate.style) !== null;
		case "cache": return await fontManager.loadCachedFont(candidate.family, candidate.style) !== null;
		case "remote": return await fontManager.loadRemoteFont(candidate.family, candidate.style, demand.characters) !== null;
		case "fallback": {
			const script = candidate.family;
			return ((await fontManager.ensureFallbackPack([script], demand.characters))[script]?.length ?? 0) > 0;
		}
	}
	return false;
};
const fontResolver = new FontResolver(productionFontLoader);
//#endregion
export { FontResolver, fontCoverageDemand, fontFaceDemand, fontRemoteCoverageDemand, fontResolver, missingGlyphCharacters, missingGlyphScripts };

//# sourceMappingURL=index.js.map