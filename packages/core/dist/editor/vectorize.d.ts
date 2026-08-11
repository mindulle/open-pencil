import { EditorContext } from "./types.js";
import { SVGVectorizeResult } from "../vector/vectorize/svg/to-vectors.js";
//#region src/editor/vectorize.d.ts
declare function createVectorizeActions(ctx: EditorContext): {
  replaceNodeWithVectorFrame: (nodeId: string, vectorized: SVGVectorizeResult) => string | null;
};
//#endregion
export { createVectorizeActions };
//# sourceMappingURL=vectorize.d.ts.map