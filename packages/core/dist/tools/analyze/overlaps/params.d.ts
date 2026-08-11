import { OverlapCategory, OverlapScope, OverlapSeverity } from "./index.js";

//#region src/tools/analyze/overlaps/params.d.ts
declare const VALID_OVERLAP_SCOPES: readonly OverlapScope[];
declare const VALID_OVERLAP_CATEGORIES: readonly OverlapCategory[];
declare const VALID_OVERLAP_SEVERITIES: readonly OverlapSeverity[];
declare function parseOverlapScope(raw: string | undefined): OverlapScope | undefined;
declare function parseOverlapCategories(raw: string | undefined): OverlapCategory[] | undefined;
declare function parseOverlapSeverity(raw: string | undefined): OverlapSeverity | undefined;
//#endregion
export { VALID_OVERLAP_CATEGORIES, VALID_OVERLAP_SCOPES, VALID_OVERLAP_SEVERITIES, parseOverlapCategories, parseOverlapScope, parseOverlapSeverity };
//# sourceMappingURL=params.d.ts.map