import { createFetch } from "ofetch";
//#region src/icons/api.ts
const ICONIFY_API = "https://api.iconify.design";
const FETCH_TIMEOUT_MS = 1e4;
function createIconifyAPIClient(fetcher = globalThis.fetch, baseURL = ICONIFY_API) {
	const iconifyAPI = createFetch({ fetch: fetcher }).create({
		baseURL,
		retry: 0,
		timeout: FETCH_TIMEOUT_MS
	});
	return {
		async fetchCollection(prefix, iconNames) {
			const response = await iconifyAPI.raw(`/${prefix}.json`, {
				ignoreResponseError: true,
				query: { icons: iconNames.join(",") }
			});
			if (!response.ok) throw new Error(`Iconify API error: ${response.status} for prefix "${prefix}"`);
			return response._data;
		},
		async search(query, options) {
			const response = await iconifyAPI.raw("/search", {
				ignoreResponseError: true,
				query: {
					query,
					limit: options?.limit,
					prefix: options?.prefix
				}
			});
			if (!response.ok) throw new Error(`Iconify search error: ${response.status}`);
			const data = response._data;
			const limit = options?.limit ?? 5;
			return {
				icons: data?.icons.slice(0, limit) ?? [],
				total: data?.total ?? 0,
				collections: data?.collections ?? {}
			};
		}
	};
}
const iconifyAPIClient = createIconifyAPIClient();
function fetchIconifyCollection(prefix, iconNames) {
	return iconifyAPIClient.fetchCollection(prefix, iconNames);
}
function searchIconify(query, options) {
	return iconifyAPIClient.search(query, options);
}
//#endregion
export { createIconifyAPIClient, fetchIconifyCollection, searchIconify };

//# sourceMappingURL=api.js.map