import { EditorContext } from "../types.js";
import { SnapGuide } from "@open-pencil/scene-graph/snap";
import { Rect } from "@open-pencil/scene-graph/primitives";

//#region src/editor/selection/overlays.d.ts
declare function createSelectionOverlayActions(ctx: EditorContext): {
  setMarquee: (rect: Rect | null) => void;
  setSnapGuides: (guides: SnapGuide[]) => void;
  setRotationPreview: (preview: {
    nodeId: string;
    angle: number;
  } | null) => void;
  setHoveredNode: (id: string | null) => void;
  setDropTarget: (id: string | null) => void;
  setLayoutInsertIndicator: (indicator: typeof ctx.state.layoutInsertIndicator) => void;
  setAutoLayoutHover: (hover: typeof ctx.state.autoLayoutHover) => void;
};
//#endregion
export { createSelectionOverlayActions };
//# sourceMappingURL=overlays.d.ts.map