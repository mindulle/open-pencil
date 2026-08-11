import { RenderOverlays } from "./renderer/types.js";
import { SkiaRenderer } from "./renderer.js";
import { Canvas } from "canvaskit-wasm";
import { SceneGraph, VectorRegion, VectorSegment, VectorVertex } from "@open-pencil/scene-graph";

//#region src/canvas/node-edit-overlay.d.ts
type HandleInfo = {
  segmentIndex: number;
  tangentField: 'tangentStart' | 'tangentEnd';
} | null | undefined;
interface NodeEditOverlayState {
  nodeId: string;
  vertices: VectorVertex[];
  segments: VectorSegment[];
  regions: VectorRegion[];
  selectedVertexIndices: Set<number>;
  selectedHandles?: Set<string>;
  hoveredHandleInfo?: HandleInfo;
}
declare function drawNodeEditOverlay(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, editState: RenderOverlays['nodeEditState']): void;
//#endregion
export { NodeEditOverlayState, drawNodeEditOverlay };
//# sourceMappingURL=node-edit-overlay.d.ts.map