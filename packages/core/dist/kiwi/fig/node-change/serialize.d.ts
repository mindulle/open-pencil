import { buildFontDigestMap } from "./font/digests.js";
import { FIG_KIWI_DEFAULT_VERSION, KiwiNodeChange, buildFigKiwi, decompressFigKiwiDataAsync, fractionalPosition, makeCanvasNodeChange, makeDocumentNodeChange, mapToFigmaType, parseFigKiwiChunks, safeColor } from "@open-pencil/fig/node-change";
import { ComponentPropertyDefinition, SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { GUID } from "@open-pencil/scene-graph/primitives";

//#region src/kiwi/fig/node-change/serialize.d.ts
declare function sceneNodeToKiwi(node: SceneNode, parentGuid: GUID, childIndex: number, localIdCounter: {
  value: number;
}, graph: SceneGraph, blobs: Uint8Array[], nodeIdToGuid?: Map<string, GUID>, fontDigestMap?: Map<string, Uint8Array>, varIdToGuid?: Map<string, GUID>, glyphBlobMap?: Map<string, number>, blobIndexByHex?: Map<string, number>, assignedGuidValues?: Set<string>, componentPropertyDefinitionsById?: ReadonlyMap<string, ComponentPropertyDefinition>, modeIdToGuid?: Map<string, GUID>): KiwiNodeChange[];
//#endregion
export { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, buildFontDigestMap, decompressFigKiwiDataAsync, fractionalPosition, makeCanvasNodeChange, makeDocumentNodeChange, mapToFigmaType, parseFigKiwiChunks, safeColor, sceneNodeToKiwi };
//# sourceMappingURL=serialize.d.ts.map