import { WebFontProviderId } from "./web-fonts.js";

//#region src/text/font-sources.d.ts
interface FontInfo {
  family: string;
  fullName: string;
  style: string;
  postscriptName: string;
}
type LocalFontAccessState = 'unsupported' | 'prompt' | 'granted' | 'denied';
type FontFamilySource = 'local' | 'bundled' | 'fallback' | WebFontProviderId;
interface FontFamilyOption {
  family: string;
  source: FontFamilySource;
}
interface DownloadedFontCache {
  read(family: string, style: string, characters?: string): Promise<ArrayBuffer | null>;
  write(family: string, style: string, data: ArrayBuffer, characters?: string): Promise<void>;
}
type HostFontLoader = (family: string, style: string) => Promise<ArrayBuffer | null>;
//#endregion
export { DownloadedFontCache, FontFamilyOption, FontFamilySource, FontInfo, HostFontLoader, LocalFontAccessState };
//# sourceMappingURL=font-sources.d.ts.map