//#region src/tools/stock-photo/providers.d.ts
interface StockPhotoResult {
  url: string;
  width: number;
  height: number;
  photographer: string;
  sourceId: string;
}
interface StockPhotoProvider {
  name: string;
  search(query: string, options: {
    perPage: number;
    orientation: 'landscape' | 'portrait' | 'square';
    targetDim: number;
  }): Promise<StockPhotoResult[]>;
}
declare function registerStockPhotoProvider(provider: StockPhotoProvider): void;
declare function setActiveStockPhotoProvider(name: string | null): void;
declare function getStockPhotoProviders(): string[];
declare function getActiveProvider(): StockPhotoProvider | null;
declare function setPexelsAPIKey(key: string | null): void;
declare function setUnsplashAccessKey(key: string | null): void;
//#endregion
export { StockPhotoProvider, StockPhotoResult, getActiveProvider, getStockPhotoProviders, registerStockPhotoProvider, setActiveStockPhotoProvider, setPexelsAPIKey, setUnsplashAccessKey };
//# sourceMappingURL=providers.d.ts.map