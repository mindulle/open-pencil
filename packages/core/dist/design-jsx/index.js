import jsx_reference_default from "../tools/prompts/jsx-reference.js";
import { isTreeNode, node, resolveToTree } from "./tree.js";
import { Component, ComponentSet, Ellipse, Frame, Group, INTRINSIC_ELEMENTS, Instance, Line, Page, Polygon, Rect, Rectangle, Section, Star, Text, Vector, View } from "./components.js";
import { defineVars, designVar, isVariable } from "./vars.js";
import { renderTree } from "./renderer.js";
import { backgroundBlur, dropShadow, foregroundBlur, innerShadow, layerBlur } from "./effects.js";
import { angularGradient, diamondGradient, gradient, linearGradient, radialGradient, solid } from "./paints.js";
import { createElement } from "./mini-react.js";
import { buildComponent, renderJSX } from "./render.js";
import { sceneNodeToJSX, selectionToJSX } from "../io/formats/jsx/export.js";
//#region src/design-jsx/index.ts
const JSX_REFERENCE = jsx_reference_default;
//#endregion
export { Component, ComponentSet, Ellipse, Frame, Group, INTRINSIC_ELEMENTS, Instance, JSX_REFERENCE, Line, Page, Polygon, Rect, Rectangle, Section, Star, Text, Vector, View, angularGradient, backgroundBlur, buildComponent, createElement, defineVars, designVar, diamondGradient, dropShadow, foregroundBlur, gradient, innerShadow, isTreeNode, isVariable, layerBlur, linearGradient, node, radialGradient, renderJSX, renderTree, renderTree as renderTreeNode, resolveToTree, sceneNodeToJSX, selectionToJSX, solid };

//# sourceMappingURL=index.js.map