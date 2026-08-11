import { Rect, Size } from "@open-pencil/scene-graph/primitives";

//#region src/io/formats/svg/metadata.d.ts
declare function parseSVGViewBox(svg: string): Rect | null;
declare function parseSVGSize(svg: string, fallback?: Size): Size;
//#endregion
export { parseSVGSize, parseSVGViewBox };
//# sourceMappingURL=metadata.d.ts.map