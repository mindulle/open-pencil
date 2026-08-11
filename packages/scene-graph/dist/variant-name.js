//#region src/variant-name.ts
function parseVariantName(name) {
	const values = {};
	for (const part of name.split(",").map((s) => s.trim())) {
		const eqIdx = part.indexOf("=");
		if (eqIdx === -1) continue;
		values[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
	}
	return values;
}
function buildVariantName(values) {
	return Object.entries(values).map(([k, v]) => `${k}=${v}`).join(", ");
}
//#endregion
export { buildVariantName, parseVariantName };

//# sourceMappingURL=variant-name.js.map