//#region src/io/formats/svg/node.d.ts
interface SVGNode {
  tag: string;
  attrs: Record<string, string | number>;
  children: (SVGNode | string)[];
}
declare function svg(tag: string, attrs: Record<string, string | number | undefined | null>, ...children: (SVGNode | string | null | undefined | false)[]): SVGNode;
declare function renderSVGNode(node: SVGNode, indent?: number): string;
//#endregion
export { SVGNode, renderSVGNode, svg };
//# sourceMappingURL=node.d.ts.map