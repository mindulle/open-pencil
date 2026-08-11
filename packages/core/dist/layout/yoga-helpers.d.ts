import { GridTrack, SceneNode } from "@open-pencil/scene-graph";
import { Align, GridTrackType, Justify, Node } from "yoga-layout";

//#region src/layout/yoga-helpers.d.ts
declare function createYogaNode(): Node;
declare function configureAbsoluteChild(yogaChild: Node, child: SceneNode): void;
declare function applyMinMaxConstraints(yogaNode: Node, node: SceneNode): void;
declare function mapGridTrack(track: GridTrack): {
  type: GridTrackType;
  value: number;
};
declare function freeYogaTree(node: Node): void;
declare function mapJustify(align: string): Justify;
declare function mapAlign(align: string): Align;
declare function mapAlignSelf(alignSelf: string): Align | null;
//#endregion
export { applyMinMaxConstraints, configureAbsoluteChild, createYogaNode, freeYogaTree, mapAlign, mapAlignSelf, mapGridTrack, mapJustify };
//# sourceMappingURL=yoga-helpers.d.ts.map