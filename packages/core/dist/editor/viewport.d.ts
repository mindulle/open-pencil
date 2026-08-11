import { EditorContext } from "./types.js";

//#region src/editor/viewport.d.ts
declare function createViewportActions(ctx: EditorContext): {
  screenToCanvas: (sx: number, sy: number) => {
    x: number;
    y: number;
  };
  setZoomAroundPoint: (level: number, centerX: number, centerY: number) => void;
  applyZoom: (delta: number, centerX: number, centerY: number) => void;
  pan: (dx: number, dy: number) => void;
  zoomToBounds: (minX: number, minY: number, maxX: number, maxY: number) => void;
  zoomToFit: () => void;
  zoomTo100: () => void;
  zoomToLevel: (level: number) => void;
  zoomToSelection: () => void;
};
//#endregion
export { createViewportActions };
//# sourceMappingURL=viewport.d.ts.map