import { Tool } from "./types.js";

//#region src/editor/tool-registry.d.ts
interface EditorToolDef {
  key: Tool;
  label: string;
  shortcut: string;
  flyout?: Tool[];
}
declare const EDITOR_TOOLS: EditorToolDef[];
declare const TOOL_SHORTCUTS: Partial<Record<string, Tool>>;
//#endregion
export { EDITOR_TOOLS, EditorToolDef, TOOL_SHORTCUTS };
//# sourceMappingURL=tool-registry.d.ts.map