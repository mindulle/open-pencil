import { ofetch } from "ofetch";
//#region src/tools/stock-photo/providers.ts
const providers = /* @__PURE__ */ new Map();
let activeProviderId = null;
function registerStockPhotoProvider(provider) {
	providers.set(provider.name, provider);
	if (!activeProviderId) activeProviderId = provider.name;
}
function setActiveStockPhotoProvider(name) {
	activeProviderId = name;
}
function getStockPhotoProviders() {
	return [...providers.keys()];
}
function getActiveProvider() {
	if (!activeProviderId) return null;
	return providers.get(activeProviderId) ?? null;
}
function pickPexelsSize(src, targetDim) {
	if (targetDim <= 200) return src.small;
	if (targetDim <= 400) return src.medium;
	if (targetDim <= 800) return src.large;
	if (targetDim <= 1600) return src.large2x;
	return src.original;
}
let pexelsAPIKey = null;
function setPexelsAPIKey(key) {
	pexelsAPIKey = key;
	if (key) {
		registerStockPhotoProvider(pexelsProvider);
		setActiveStockPhotoProvider("pexels");
	}
}
const pexelsProvider = {
	name: "pexels",
	async search(query, { perPage, orientation, targetDim }) {
		if (!pexelsAPIKey) throw new Error("Pexels API key not configured");
		const response = await ofetch.raw("https://api.pexels.com/v1/search", {
			headers: { Authorization: pexelsAPIKey },
			ignoreResponseError: true,
			query: {
				query,
				per_page: perPage,
				orientation
			},
			retry: 0
		});
		if (!response.ok) throw new Error(`Pexels ${response.status}`);
		return response._data.photos.map((photo) => ({
			url: pickPexelsSize(photo.src, targetDim),
			width: photo.width,
			height: photo.height,
			photographer: photo.photographer,
			sourceId: String(photo.id)
		}));
	}
};
let unsplashAccessKey = null;
function setUnsplashAccessKey(key) {
	unsplashAccessKey = key;
	if (key) registerStockPhotoProvider(unsplashProvider);
}
function pickUnsplashSize(urls, targetDim) {
	if (targetDim <= 200) return urls.thumb;
	if (targetDim <= 400) return urls.small;
	if (targetDim <= 1080) return urls.regular;
	return urls.full;
}
const unsplashProvider = {
	name: "unsplash",
	async search(query, { perPage, orientation }) {
		if (!unsplashAccessKey) throw new Error("Unsplash access key not configured");
		const orient = orientation === "square" ? "squarish" : orientation;
		const response = await ofetch.raw("https://api.unsplash.com/search/photos", {
			headers: {
				Authorization: `Client-ID ${unsplashAccessKey}`,
				"Accept-Version": "v1"
			},
			ignoreResponseError: true,
			query: {
				query,
				per_page: perPage,
				orientation: orient
			},
			retry: 0
		});
		if (!response.ok) throw new Error(`Unsplash ${response.status}`);
		return response._data.results.map((photo) => ({
			url: pickUnsplashSize(photo.urls, 1080),
			width: photo.width,
			height: photo.height,
			photographer: photo.user.name,
			sourceId: photo.id
		}));
	}
};
//#endregion
export { getActiveProvider, getStockPhotoProviders, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey };

//# sourceMappingURL=providers.js.map