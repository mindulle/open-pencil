import { IconSearchResult, IconifyResponse } from "./types.js";

//#region src/icons/api.d.ts
declare function createIconifyAPIClient(fetcher?: typeof globalThis.fetch, baseURL?: string): {
  fetchCollection(prefix: string, iconNames: string[]): Promise<IconifyResponse>;
  search(query: string, options?: {
    limit?: number;
    prefix?: string;
  }): Promise<IconSearchResult>;
};
declare function fetchIconifyCollection(prefix: string, iconNames: string[]): Promise<IconifyResponse>;
declare function searchIconify(query: string, options?: {
  limit?: number;
  prefix?: string;
}): Promise<IconSearchResult>;
//#endregion
export { createIconifyAPIClient, fetchIconifyCollection, searchIconify };
//# sourceMappingURL=api.d.ts.map