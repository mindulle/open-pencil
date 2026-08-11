import { EditorContext } from "../types.js";
import { SceneNode } from "@open-pencil/scene-graph";

//#region src/editor/clipboard/paste-replace.d.ts
type CenterNodesAt = (nodeIds: string[], cx: number, cy: number) => void;
declare function selectedReplacementTargets(ctx: EditorContext): SceneNode[];
declare function replaceTargetsWithCreated(ctx: EditorContext, centerNodesAt: CenterNodesAt, created: string[], targets: SceneNode[], prevSelection: Set<string>): boolean;
//#endregion
export { replaceTargetsWithCreated, selectedReplacementTargets };
//# sourceMappingURL=paste-replace.d.ts.map