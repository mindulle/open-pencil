import { node } from "./tree.js";
//#region src/design-jsx/components.ts
function withChildren(type, props, children) {
	if (children.length > 0) return node(type, {
		...props,
		children
	});
	return node(type, props);
}
function Frame(props, ...children) {
	return withChildren("frame", props, children);
}
function Text(props, ...children) {
	return withChildren("text", props, children);
}
function Rectangle(props, ...children) {
	return withChildren("rectangle", props, children);
}
function Ellipse(props, ...children) {
	return withChildren("ellipse", props, children);
}
function Line(props, ...children) {
	return withChildren("line", props, children);
}
function Star(props, ...children) {
	return withChildren("star", props, children);
}
function Polygon(props, ...children) {
	return withChildren("polygon", props, children);
}
function Vector(props, ...children) {
	return withChildren("vector", props, children);
}
function Group(props, ...children) {
	return withChildren("group", props, children);
}
function Section(props, ...children) {
	return withChildren("section", props, children);
}
function Component(props, ...children) {
	return withChildren("component", props, children);
}
function ComponentSet(props, ...children) {
	return withChildren("component-set", props, children);
}
function Instance(props, ...children) {
	return withChildren("instance", props, children);
}
const View = Frame;
const Rect = Rectangle;
const Page = Frame;
const INTRINSIC_ELEMENTS = [
	"frame",
	"text",
	"rectangle",
	"ellipse",
	"line",
	"star",
	"polygon",
	"vector",
	"group",
	"section",
	"component",
	"component-set",
	"instance"
];
//#endregion
export { Component, ComponentSet, Ellipse, Frame, Group, INTRINSIC_ELEMENTS, Instance, Line, Page, Polygon, Rect, Rectangle, Section, Star, Text, Vector, View };

//# sourceMappingURL=components.js.map