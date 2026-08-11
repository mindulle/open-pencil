import { evalCode } from "./analyze/eval/index.js";
import { calc } from "./calc.js";
import { render } from "./create/render.js";
import { describe } from "./describe/index.js";
import { setRadius } from "./modify/geometry.js";
import { setLayout, setLayoutChild } from "./modify/layout.js";
import { setFill, setStroke } from "./modify/paint.js";
import { setText, setTextProperties } from "./modify/text.js";
import { updateNode } from "./modify/update.js";
import { getJSX } from "./read/jsx.js";
import { findNodes, getNode } from "./read/nodes.js";
import { getSelection } from "./read/selection.js";
import { stockPhoto } from "./stock-photo.js";
import { deleteNode, nodeResize } from "./structure/basic.js";
import { reparentNode } from "./structure/hierarchy.js";
import { batchUpdate } from "./structure/batch.js";
import { viewportZoomToFit } from "./vector/viewport.js";
//#region src/tools/registry-core.ts
/**
* Core tools registered by default in AI chat (~30 tools, ~3K schema tokens).
* Covers 90%+ of design sessions: render, describe, modify, structure, icons.
*/
const CORE_TOOLS = [
	getSelection,
	getNode,
	findNodes,
	getJSX,
	render,
	updateNode,
	setLayout,
	setLayoutChild,
	setRadius,
	setFill,
	setStroke,
	setText,
	setTextProperties,
	deleteNode,
	reparentNode,
	nodeResize,
	batchUpdate,
	stockPhoto,
	describe,
	calc,
	evalCode,
	viewportZoomToFit
];
//#endregion
export { CORE_TOOLS };

//# sourceMappingURL=registry-core.js.map