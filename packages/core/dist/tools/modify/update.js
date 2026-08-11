import { defineTool, nodeNotFound } from "../schema.js";
//#region src/tools/modify/update.ts
const updateNode = defineTool({
	name: "update_node",
	mutates: true,
	description: "Update properties of an existing node: position, size, opacity, corner radius, visibility, text, font.",
	params: {
		id: {
			type: "string",
			description: "Node ID",
			required: true
		},
		x: {
			type: "number",
			description: "X position"
		},
		y: {
			type: "number",
			description: "Y position"
		},
		width: {
			type: "number",
			description: "Width",
			min: 1
		},
		height: {
			type: "number",
			description: "Height",
			min: 1
		},
		opacity: {
			type: "number",
			description: "Opacity (0-1)",
			min: 0,
			max: 1
		},
		corner_radius: {
			type: "number",
			description: "Corner radius",
			min: 0
		},
		visible: {
			type: "boolean",
			description: "Visibility"
		},
		text: {
			type: "string",
			description: "Text content (TEXT nodes)"
		},
		text_direction: {
			type: "string",
			description: "Text direction for TEXT nodes",
			enum: [
				"AUTO",
				"LTR",
				"RTL"
			]
		},
		flow_direction: {
			type: "string",
			description: "Auto-layout flow direction for FRAME nodes",
			enum: [
				"AUTO",
				"LTR",
				"RTL"
			]
		},
		font_size: {
			type: "number",
			description: "Font size",
			min: 1
		},
		font_weight: {
			type: "number",
			description: "Font weight (100-900)"
		},
		name: {
			type: "string",
			description: "Layer name"
		}
	},
	execute: (figma, args) => {
		const node = figma.getNodeById(args.id);
		if (!node) return nodeNotFound(args.id);
		const updated = [];
		if (args.x !== void 0) {
			node.x = args.x;
			updated.push("x");
		}
		if (args.y !== void 0) {
			node.y = args.y;
			updated.push("y");
		}
		if (args.width !== void 0 || args.height !== void 0) {
			node.resize(args.width ?? node.width, args.height ?? node.height);
			updated.push("size");
		}
		if (args.opacity !== void 0) {
			node.opacity = args.opacity;
			updated.push("opacity");
		}
		if (args.corner_radius !== void 0) {
			node.cornerRadius = args.corner_radius;
			updated.push("cornerRadius");
		}
		if (args.visible !== void 0) {
			node.visible = args.visible;
			updated.push("visible");
		}
		if (args.name !== void 0) {
			node.name = args.name;
			updated.push("name");
		}
		if (args.text !== void 0) {
			figma.graph.updateNode(node.id, { text: args.text });
			updated.push("text");
		}
		if (args.text_direction !== void 0) {
			figma.graph.updateNode(node.id, { textDirection: args.text_direction });
			updated.push("textDirection");
		}
		if (args.flow_direction !== void 0) {
			figma.graph.updateNode(node.id, { layoutDirection: args.flow_direction });
			updated.push("layoutDirection");
		}
		if (args.font_size !== void 0) {
			figma.graph.updateNode(node.id, { fontSize: args.font_size });
			updated.push("fontSize");
		}
		if (args.font_weight !== void 0) {
			figma.graph.updateNode(node.id, { fontWeight: args.font_weight });
			updated.push("fontWeight");
		}
		return {
			id: args.id,
			updated
		};
	}
});
//#endregion
export { updateNode };

//# sourceMappingURL=update.js.map