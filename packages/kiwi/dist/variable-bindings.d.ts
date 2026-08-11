import { GUID } from "./types.js";

//#region src/fig/variable-bindings.d.ts
interface VariableBinding {
  variableID: GUID;
}
interface PaintWithVariableBinding {
  colorVariableBinding?: VariableBinding;
}
interface NodeChangeWithVariableBindings {
  fillPaints?: PaintWithVariableBinding[];
  strokePaints?: PaintWithVariableBinding[];
}
interface VariableBindingCodec<Paint, NodeChange> {
  encodePaint(paint: Paint): Uint8Array;
  encodeNodeChange(nodeChange: NodeChange): Uint8Array;
}
declare function encodeVarint(value: number): number[];
declare function encodePaintWithVariableBinding<Paint extends PaintWithVariableBinding>(codec: VariableBindingCodec<Omit<Paint, 'colorVariableBinding'>, unknown>, paint: Paint, variableSessionID: number, variableLocalID: number): Uint8Array;
declare function parseVariableId(variableId: string): GUID | null;
declare function encodeNodeChangeWithVariables<NodeChange extends NodeChangeWithVariableBindings>(codec: VariableBindingCodec<unknown, Omit<NodeChange, 'fillPaints' | 'strokePaints'> & {
  fillPaints?: Omit<PaintWithVariableBinding, 'colorVariableBinding'>[];
  strokePaints?: Omit<PaintWithVariableBinding, 'colorVariableBinding'>[];
}>, nodeChange: NodeChange): Uint8Array;
//#endregion
export { NodeChangeWithVariableBindings, PaintWithVariableBinding, VariableBinding, VariableBindingCodec, encodeNodeChangeWithVariables, encodePaintWithVariableBinding, encodeVarint, parseVariableId };
//# sourceMappingURL=variable-bindings.d.ts.map