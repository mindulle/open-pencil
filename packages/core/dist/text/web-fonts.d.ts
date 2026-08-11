//#region src/text/web-fonts.d.ts
declare const WEB_FONT_PROVIDER_IDS: readonly ["google", "fontsource", "bunny", "fontshare"];
type WebFontProviderId = (typeof WEB_FONT_PROVIDER_IDS)[number];
declare const WEB_FONT_PROVIDER_LABELS: Record<WebFontProviderId, string>;
declare const DEFAULT_WEB_FONT_PROVIDER_SETTINGS: Record<WebFontProviderId, boolean>;
type WebFontFetch = (url: string, init?: RequestInit) => Promise<Response>;
declare function normalizedCoverageText(text: string): string;
declare function webFontSubsetsForText(text: string): string[];
declare class WebFontResolver {
  private enabled;
  private unifontPromises;
  private familiesCache;
  private familiesPromises;
  private failedFonts;
  private fontPromises;
  private remoteFetch;
  private fetchProxyQueue;
  setEnabled(settings: Partial<Record<WebFontProviderId, boolean>>): void;
  setRemoteFetch(fetcher: WebFontFetch | null): void;
  enabledProviders(): WebFontProviderId[];
  preloadFamilies(): void;
  listFamilies(provider: WebFontProviderId): Promise<string[]>;
  fetchFont(families: string[], style: string, characters?: string): Promise<ArrayBuffer[]>;
  private withFetchProxy;
  private fetchRemote;
  private unifont;
  private loadFamilies;
  private fetchFromProvider;
  private loadFromProvider;
}
//#endregion
export { DEFAULT_WEB_FONT_PROVIDER_SETTINGS, WEB_FONT_PROVIDER_IDS, WEB_FONT_PROVIDER_LABELS, WebFontFetch, WebFontProviderId, WebFontResolver, normalizedCoverageText, webFontSubsetsForText };
//# sourceMappingURL=web-fonts.d.ts.map