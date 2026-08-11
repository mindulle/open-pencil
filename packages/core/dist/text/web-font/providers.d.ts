import { WebFontProviderId } from "../web-fonts.js";
import { GoogleFamilyOptions, RemoteFontSource, ResolveFontOptions, Unifont, providers } from "unifont";

//#region src/text/web-font/providers.d.ts
type WebFontProvider = ReturnType<typeof providers.google> | ReturnType<typeof providers.fontsource> | ReturnType<typeof providers.bunny> | ReturnType<typeof providers.fontshare>;
type WebUnifont = Unifont<[WebFontProvider]>;
type WebFontResolveOptions = Pick<ResolveFontOptions<{
  google?: GoogleFamilyOptions;
}>, 'weights' | 'styles' | 'formats' | 'subsets' | 'options'>;
declare const providerFactories: {
  google: (options?: import("unifont").GoogleProviderOptions | undefined) => import("unifont").Provider<"google", GoogleFamilyOptions>;
  fontsource: () => import("unifont").Provider<"fontsource", never>;
  bunny: () => import("unifont").Provider<"bunny", never>;
  fontshare: () => import("unifont").Provider<"fontshare", never>;
};
declare function createProviderUnifont(provider: WebFontProviderId): Promise<WebUnifont>;
declare function isRemoteFontSource(source: RemoteFontSource | {
  name: string;
}): source is RemoteFontSource;
//#endregion
export { WebFontProvider, WebFontResolveOptions, WebUnifont, createProviderUnifont, isRemoteFontSource, providerFactories };
//# sourceMappingURL=providers.d.ts.map