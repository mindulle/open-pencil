import { IconData, IconPath, IconSearchResult } from "./types.js";
import { searchIconify } from "./api.js";

//#region src/icons/index.d.ts
declare function clearIconCache(): void;
declare function fetchIcon(name: string, size?: number): Promise<IconData>;
declare function fetchIcons(names: string[], size?: number): Promise<Map<string, IconData>>;
declare function searchIconsBatch(queries: string[], options?: {
  limit?: number;
  prefix?: string;
}): Promise<Map<string, IconSearchResult>>;
//#endregion
export { type IconData, type IconPath, type IconSearchResult, clearIconCache, fetchIcon, fetchIcons, searchIconify as searchIcons, searchIconsBatch };
//# sourceMappingURL=index.d.ts.map