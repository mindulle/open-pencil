import { getGlyphOutlineMetricsSync } from "../../../text/opentype.js";
import { buildFontDigestMap } from "./font/digests.js";
import { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, decompressFigKiwiDataAsync, fractionalPosition, makeCanvasNodeChange, makeDocumentNodeChange, mapToFigmaType, parseFigKiwiChunks, safeColor, sceneNodeToKiwi as sceneNodeToKiwi$1 } from "@open-pencil/fig/node-change";
//#region src/kiwi/fig/node-change/serialize.ts
const coreFigExportRuntime = { getGlyphOutlineMetrics: getGlyphOutlineMetricsSync };
function sceneNodeToKiwi(node, parentGuid, childIndex, localIdCounter, graph, blobs, nodeIdToGuid, fontDigestMap, varIdToGuid, glyphBlobMap = /* @__PURE__ */ new Map(), blobIndexByHex, assignedGuidValues, componentPropertyDefinitionsById, modeIdToGuid) {
	return sceneNodeToKiwi$1(node, parentGuid, childIndex, localIdCounter, graph, blobs, nodeIdToGuid, fontDigestMap, varIdToGuid, glyphBlobMap, blobIndexByHex, assignedGuidValues, coreFigExportRuntime, componentPropertyDefinitionsById, modeIdToGuid);
}
//#endregion
export { FIG_KIWI_DEFAULT_VERSION, buildFigKiwi, buildFontDigestMap, decompressFigKiwiDataAsync, fractionalPosition, makeCanvasNodeChange, makeDocumentNodeChange, mapToFigmaType, parseFigKiwiChunks, safeColor, sceneNodeToKiwi };

//# sourceMappingURL=serialize.js.map