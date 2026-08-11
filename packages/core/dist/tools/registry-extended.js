import { analyzeClusters } from "./analyze/clusters.js";
import { analyzeColors } from "./analyze/colors.js";
import { diffCreate, diffShow } from "./analyze/diff.js";
import { analyzeOverlaps } from "./analyze/overlaps/index.js";
import { analyzeSpacing } from "./analyze/spacing.js";
import { analyzeTypography } from "./analyze/typography.js";
import { createPage, createShape, createSlice } from "./create/basic.js";
import { createComponent, createInstance } from "./create/components.js";
import { fetchIconsTool, insertIcon, searchIconsTool } from "./create/icons.js";
import { importSVG } from "./create/svg.js";
import { createVector } from "./create/vector.js";
import { setEffects } from "./modify/effects.js";
import { setMinMax, setOpacity, setRotation } from "./modify/geometry.js";
import { setConstraints } from "./modify/layout.js";
import { setImageFill } from "./modify/paint.js";
import { setBlend, setLocked, setStrokeAlign, setVisible } from "./modify/state.js";
import { setFont, setFontRange, setTextResize } from "./modify/text.js";
import { getComponents } from "./read/components.js";
import { listAvailableFonts, listFonts } from "./read/fonts.js";
import { diffJSX } from "./read/jsx.js";
import { getPageTree } from "./read/nodes.js";
import { getCurrentPage, listPages, pageBounds, switchPage } from "./read/pages.js";
import { queryNodes } from "./read/query.js";
import { selectNodes } from "./read/selection.js";
import { cloneNode, nodeBounds, nodeMove, renameNode } from "./structure/basic.js";
import { flattenNodes, groupNodes, nodeToComponent, ungroupNode } from "./structure/hierarchy.js";
import { nodeAncestors, nodeBindings, nodeChildren, nodeTree } from "./structure/tree.js";
import { nodeReplaceWith } from "./structure/replace.js";
import { arrangeNodes } from "./structure/arrange.js";
import { booleanExclude, booleanIntersect, booleanSubtract, booleanUnion } from "./vector/boolean.js";
import { pathFlip, pathGet, pathMove, pathScale, pathSet } from "./vector/path.js";
import { viewportGet, viewportSet } from "./vector/viewport.js";
import { exportImage, exportPDF, exportSVG } from "./vector/export.js";
import { designToComponentMap } from "./codegen/component-map.js";
import { designToTokens } from "./codegen/tokens.js";
import { bindVariable } from "./variables/bindings.js";
import { unbindVariable } from "./variables/unbind.js";
import { createCollection, deleteCollection, getCollection, listCollections } from "./variables/collections.js";
import { findVariables, getVariable, listVariables } from "./variables/read.js";
import { createVariable, deleteVariable, setVariable } from "./variables/values.js";
//#region src/tools/registry-extended.ts
/**
* Extended tools not in CORE_TOOLS — variables, vector ops, analysis,
* codegen, advanced structure, path manipulation, etc.
*/
const EXTENDED_TOOLS = [
	getPageTree,
	getCurrentPage,
	listPages,
	selectNodes,
	queryNodes,
	getComponents,
	switchPage,
	pageBounds,
	listFonts,
	listAvailableFonts,
	diffJSX,
	createShape,
	searchIconsTool,
	insertIcon,
	fetchIconsTool,
	createComponent,
	createInstance,
	createPage,
	createVector,
	createSlice,
	importSVG,
	setEffects,
	setOpacity,
	setFont,
	setVisible,
	setConstraints,
	setRotation,
	setMinMax,
	setFontRange,
	setTextResize,
	setBlend,
	setLocked,
	setStrokeAlign,
	setImageFill,
	cloneNode,
	nodeMove,
	renameNode,
	groupNodes,
	ungroupNode,
	flattenNodes,
	nodeToComponent,
	nodeBounds,
	nodeAncestors,
	nodeChildren,
	nodeTree,
	nodeBindings,
	nodeReplaceWith,
	arrangeNodes,
	listVariables,
	listCollections,
	getVariable,
	findVariables,
	createVariable,
	setVariable,
	deleteVariable,
	bindVariable,
	unbindVariable,
	getCollection,
	createCollection,
	deleteCollection,
	booleanUnion,
	booleanSubtract,
	booleanIntersect,
	booleanExclude,
	pathGet,
	pathSet,
	pathScale,
	pathFlip,
	pathMove,
	viewportGet,
	viewportSet,
	exportSVG,
	exportPDF,
	exportImage,
	analyzeColors,
	analyzeTypography,
	analyzeSpacing,
	analyzeClusters,
	analyzeOverlaps,
	diffCreate,
	diffShow,
	designToTokens,
	designToComponentMap
];
//#endregion
export { EXTENDED_TOOLS };

//# sourceMappingURL=registry-extended.js.map