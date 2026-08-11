import { createUnifont, providers } from "unifont";
//#region src/text/web-font/providers.ts
const providerFactories = {
	google: providers.google,
	fontsource: providers.fontsource,
	bunny: providers.bunny,
	fontshare: providers.fontshare
};
async function createProviderUnifont(provider) {
	return createUnifont([providerFactories[provider]()], { throwOnError: false });
}
function isRemoteFontSource(source) {
	return "url" in source;
}
//#endregion
export { createProviderUnifont, isRemoteFontSource, providerFactories };

//# sourceMappingURL=providers.js.map