//#region src/tools/analyze/overlaps/params.ts
const VALID_OVERLAP_SCOPES = [
	"all",
	"same-parent",
	"cross-parent",
	"top-level",
	"inside-parent"
];
const VALID_OVERLAP_CATEGORIES = [
	"sibling-overlap",
	"parent-overflow",
	"overlay"
];
const VALID_OVERLAP_SEVERITIES = [
	"critical",
	"major",
	"minor",
	"info"
];
function parseOverlapScope(raw) {
	if (!raw) return void 0;
	const normalized = raw.trim().toLowerCase();
	if (!normalized) return void 0;
	return VALID_OVERLAP_SCOPES.find((scope) => scope === normalized);
}
function parseOverlapCategories(raw) {
	if (!raw) return void 0;
	const values = raw.split(",").map((v) => v.trim().toLowerCase()).filter((v) => v.length > 0);
	if (values.length === 0) return void 0;
	const categories = values.filter((v) => VALID_OVERLAP_CATEGORIES.includes(v));
	return categories.length > 0 ? categories : void 0;
}
function parseOverlapSeverity(raw) {
	if (!raw) return void 0;
	const normalized = raw.trim().toLowerCase();
	if (!normalized) return void 0;
	return VALID_OVERLAP_SEVERITIES.find((severity) => severity === normalized);
}
//#endregion
export { VALID_OVERLAP_CATEGORIES, VALID_OVERLAP_SCOPES, VALID_OVERLAP_SEVERITIES, parseOverlapCategories, parseOverlapScope, parseOverlapSeverity };

//# sourceMappingURL=params.js.map