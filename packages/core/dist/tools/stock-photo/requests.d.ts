import { PhotoRequest } from "./apply.js";

//#region src/tools/stock-photo/requests.d.ts
declare function parsePhotoRequests(value: unknown): PhotoRequest[] | {
  error: string;
};
//#endregion
export { parsePhotoRequests };
//# sourceMappingURL=requests.d.ts.map