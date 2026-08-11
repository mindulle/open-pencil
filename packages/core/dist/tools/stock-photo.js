import { defineTool } from "./schema.js";
import { applyPhoto } from "./stock-photo/apply.js";
import { getActiveProvider, getStockPhotoProviders, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey } from "./stock-photo/providers.js";
import { parsePhotoRequests } from "./stock-photo/requests.js";
//#region src/tools/stock-photo.ts
const stockPhoto = defineTool({
	name: "stock_photo",
	mutates: true,
	description: "Search stock photos and apply to nodes. Pass a JSON array — all fetched in parallel. Each item: {id, query, index?, orientation?}. Only works on leaf shapes (Rectangle/Ellipse).",
	params: { requests: {
		type: "string",
		description: "JSON array: [{\"id\":\"0:5\",\"query\":\"mountain sunset\"},{\"id\":\"0:8\",\"query\":\"business team\",\"orientation\":\"square\"}]",
		required: true
	} },
	execute: async (figma, { requests }) => {
		const provider = getActiveProvider();
		if (!provider) return { error: `No stock photo provider configured. Ask the user to add an API key in AI chat settings. Available providers: Pexels, Unsplash.` };
		const reqs = parsePhotoRequests(requests);
		if ("error" in reqs) return reqs;
		const results = await Promise.all(reqs.map((request) => applyPhoto(figma, provider, request)));
		const ok = results.filter((result) => result.photo).length;
		return {
			applied: ok,
			failed: results.length - ok,
			provider: provider.name,
			results
		};
	}
});
//#endregion
export { applyPhoto, getStockPhotoProviders, parsePhotoRequests, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey, stockPhoto };

//# sourceMappingURL=stock-photo.js.map