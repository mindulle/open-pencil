import { Color, Effect, Fill, GridTrack, SceneGraph, SceneNode, Stroke } from "@open-pencil/scene-graph";

//#region src/io/formats/jsx/helpers.d.ts
declare function formatColor(color: Color, opacity?: number): string;
declare function solidFillColor(fills: Fill[]): string | null;
declare function solidStroke(strokes: Stroke[]): {
  color: string;
  weight: number;
  dash: number[] | null;
} | null;
declare function formatShadow(e: Effect): string | null;
declare function escapeJSXText(text: string): string;
declare function formatProp(key: string, value: unknown): string;
declare function getNodeContext(node: SceneNode, graph: SceneGraph): {
  isAutoLayout: boolean;
  isGrid: boolean;
  isFlex: boolean;
  parentIsAutoLayout: boolean;
  parentIsGrid: boolean;
};
type PaddingEdges = {
  pt: number;
  pr: number;
  pb: number;
  pl: number;
};
declare function collectPadding(node: SceneNode): PaddingEdges | null;
declare function emitPadding<T>(edges: PaddingEdges, uniform: (v: number) => T, symmetric: (y: number, x: number) => T[], individual: (edges: PaddingEdges) => T[]): T[];
interface CornerRadii {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}
declare function collectCornerRadii(node: SceneNode): CornerRadii | null;
declare function formatTrack(t: GridTrack): string;
declare function formatTracks(tracks: GridTrack[]): string;
//#endregion
export { CornerRadii, PaddingEdges, collectCornerRadii, collectPadding, emitPadding, escapeJSXText, formatColor, formatProp, formatShadow, formatTrack, formatTracks, getNodeContext, solidFillColor, solidStroke };
//# sourceMappingURL=helpers.d.ts.map