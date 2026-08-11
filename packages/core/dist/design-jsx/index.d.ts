import { DesignVariable, VarDef, defineVars, designVar, isVariable } from "./vars.js";
import { BaseProps, PaintProp, StyleProps, TextProps, TreeNode, isTreeNode, node, resolveToTree } from "./tree.js";
import { Component, ComponentSet, Ellipse, Frame, Group, INTRINSIC_ELEMENTS, Instance, Line, Page, Polygon, Rect, Rectangle, Section, Star, Text, Vector, View } from "./components.js";
import { BlurEffectOptions, EffectColor, ShadowEffectOptions, backgroundBlur, dropShadow, foregroundBlur, innerShadow, layerBlur } from "./effects.js";
import { RenderResult, renderTree } from "./renderer.js";
import { GradientPaintOptions, PaintColor, PaintStop, SolidPaintOptions, angularGradient, diamondGradient, gradient, linearGradient, radialGradient, solid } from "./paints.js";
import { createElement } from "./mini-react.js";
import { buildComponent, renderJSX } from "./render.js";
import { JSXFormat, sceneNodeToJSX, selectionToJSX } from "../io/formats/jsx/export.js";
//#region src/design-jsx/index.d.ts
declare const JSX_REFERENCE: string;
//#endregion
export { type BaseProps, type BlurEffectOptions, Component, ComponentSet, type DesignVariable, type EffectColor, Ellipse, Frame, type GradientPaintOptions, Group, INTRINSIC_ELEMENTS, Instance, type JSXFormat, JSX_REFERENCE, Line, Page, type PaintColor, type PaintProp, type PaintStop, Polygon, Rect, Rectangle, type RenderResult, Section, type ShadowEffectOptions, type SolidPaintOptions, Star, type StyleProps, Text, type TextProps, type TreeNode, type VarDef, Vector, View, angularGradient, backgroundBlur, buildComponent, createElement, defineVars, designVar, diamondGradient, dropShadow, foregroundBlur, gradient, innerShadow, isTreeNode, isVariable, layerBlur, linearGradient, node, radialGradient, renderJSX, renderTree, renderTree as renderTreeNode, resolveToTree, sceneNodeToJSX, selectionToJSX, solid };
//# sourceMappingURL=index.d.ts.map