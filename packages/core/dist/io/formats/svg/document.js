import { DOMParser } from "@xmldom/xmldom";
//#region src/io/formats/svg/document.ts
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function parseXML(source) {
	try {
		return new DOMParser({ onError: (level, message) => {
			if (level !== "warning") throw new Error(message);
		} }).parseFromString(source, "image/svg+xml");
	} catch {
		return null;
	}
}
function parseSVGDocument(source) {
	const xmlDocument = parseXML(source);
	return xmlDocument?.documentElement?.localName === "svg" ? xmlDocument : null;
}
function parseSVGFragment(source) {
	return parseXML(`<svg xmlns="${SVG_NAMESPACE}">${source}</svg>`);
}
//#endregion
export { parseSVGDocument, parseSVGFragment };

//# sourceMappingURL=document.js.map