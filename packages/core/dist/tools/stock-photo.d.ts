import { ToolDef } from "./schema.js";
import { StockPhotoProvider, StockPhotoResult, getStockPhotoProviders, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey } from "./stock-photo/providers.js";
import { PhotoRequest, PhotoResult, applyPhoto } from "./stock-photo/apply.js";
import { parsePhotoRequests } from "./stock-photo/requests.js";

//#region src/tools/stock-photo.d.ts
declare const stockPhoto: ToolDef;
//#endregion
export { type PhotoRequest, type PhotoResult, type StockPhotoProvider, type StockPhotoResult, applyPhoto, getStockPhotoProviders, parsePhotoRequests, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey, stockPhoto };
//# sourceMappingURL=stock-photo.d.ts.map