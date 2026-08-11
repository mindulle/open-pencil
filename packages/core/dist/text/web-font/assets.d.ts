import { WebFontFetch, WebFontProviderId } from "../web-fonts.js";

//#region src/text/web-font/assets.d.ts
interface WebFontFaceRequest {
  family: string;
  weight: number;
  style?: 'normal' | 'italic';
}
interface WebFontFaceAsset {
  family: string;
  weight: string | number | [number, number];
  style: string;
  display?: string;
  stretch?: string;
  unicodeRange?: string[];
  format: 'woff2' | 'woff' | 'opentype' | 'truetype';
  path: string;
  content: Uint8Array;
}
interface ExportWebFontFaceAssetsOptions {
  fonts: WebFontFaceRequest[];
  providers?: WebFontProviderId[];
  assetBasePath?: string;
  fetcher?: WebFontFetch;
}
interface ExportWebFontFaceAssetsResult {
  assets: WebFontFaceAsset[];
}
declare function exportWebFontFaceAssets({
  fonts,
  providers,
  assetBasePath,
  fetcher
}: ExportWebFontFaceAssetsOptions): Promise<ExportWebFontFaceAssetsResult>;
//#endregion
export { ExportWebFontFaceAssetsOptions, ExportWebFontFaceAssetsResult, WebFontFaceAsset, WebFontFaceRequest, exportWebFontFaceAssets };
//# sourceMappingURL=assets.d.ts.map