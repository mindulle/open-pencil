import { IconData, IconPathInfo, IconifyIconEntry } from "./types.js";

//#region src/icons/svg.d.ts
declare function extractPaths(svgBody: string): IconPathInfo[];
declare function buildIconData(iconEntry: IconifyIconEntry, prefix: string, iconName: string, defaultW: number, defaultH: number, size: number): IconData;
/** Scale extracted SVG path info into IconData paths (shared by buildIconData and design-jsx <svg>). */
declare function scalePathInfos(pathInfos: IconPathInfo[], scaleX: number, scaleY: number): IconData['paths'];
//#endregion
export { buildIconData, extractPaths, scalePathInfos };
//# sourceMappingURL=svg.d.ts.map