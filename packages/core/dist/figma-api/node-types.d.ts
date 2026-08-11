import { FigmaNodeProxy } from "./proxy.js";

//#region src/figma-api/node-types.d.ts
type FigmaRectangleNode = FigmaNodeProxy & RectangleNode;
type FigmaFrameNode = FigmaNodeProxy & FrameNode;
type FigmaTextNode = FigmaNodeProxy & TextNode;
type FigmaEllipseNode = FigmaNodeProxy & EllipseNode;
type FigmaLineNode = FigmaNodeProxy & LineNode;
type FigmaVectorNode = FigmaNodeProxy & VectorNode;
type FigmaPolygonNode = FigmaNodeProxy & PolygonNode;
type FigmaStarNode = FigmaNodeProxy & StarNode;
type FigmaComponentNode = FigmaNodeProxy & ComponentNode;
type FigmaSectionNode = FigmaNodeProxy & SectionNode;
type FigmaGroupNode = FigmaNodeProxy & GroupNode;
type FigmaBooleanOperationNode = FigmaNodeProxy & BooleanOperationNode;
//#endregion
export { FigmaBooleanOperationNode, FigmaComponentNode, FigmaEllipseNode, FigmaFrameNode, FigmaGroupNode, FigmaLineNode, FigmaPolygonNode, FigmaRectangleNode, FigmaSectionNode, FigmaStarNode, FigmaTextNode, FigmaVectorNode };
//# sourceMappingURL=node-types.d.ts.map