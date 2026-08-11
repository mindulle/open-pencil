import { FigmaAPI } from "../../figma-api/index.js";
import { StockPhotoProvider } from "./providers.js";

//#region src/tools/stock-photo/apply.d.ts
interface PhotoRequest {
  id: string;
  query: string;
  index?: number;
  orientation?: 'landscape' | 'portrait' | 'square';
}
interface PhotoResult {
  id: string;
  photo?: {
    sourceId: string;
    photographer: string;
    width: number;
    height: number;
    provider: string;
  };
  error?: string;
}
declare function applyPhoto(figma: FigmaAPI, provider: StockPhotoProvider, req: PhotoRequest): Promise<PhotoResult>;
//#endregion
export { PhotoRequest, PhotoResult, applyPhoto };
//# sourceMappingURL=apply.d.ts.map