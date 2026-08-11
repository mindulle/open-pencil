import { defineTool } from "../schema.js";
import { safeDestr } from "destr";
//#region src/tools/structure/batch.ts
function str(value) {
	return typeof value === "string" ? value : "";
}
function num(value) {
	return typeof value === "number" ? value : 0;
}
function applyBatchProps(node, props) {
	const updated = [];
	if (props.spacing !== void 0) {
		node.itemSpacing = num(props.spacing);
		updated.push("spacing");
	}
	if (props.padding !== void 0) {
		const value = num(props.padding);
		node.paddingTop = value;
		node.paddingRight = value;
		node.paddingBottom = value;
		node.paddingLeft = value;
		updated.push("padding");
	}
	if (props.padding_horizontal !== void 0) {
		node.paddingLeft = num(props.padding_horizontal);
		node.paddingRight = num(props.padding_horizontal);
		updated.push("padding_horizontal");
	}
	if (props.padding_vertical !== void 0) {
		node.paddingTop = num(props.padding_vertical);
		node.paddingBottom = num(props.padding_vertical);
		updated.push("padding_vertical");
	}
	if (props.counter_align !== void 0) {
		node.counterAxisAlignItems = str(props.counter_align);
		updated.push("counter_align");
	}
	if (props.align !== void 0) {
		node.primaryAxisAlignItems = str(props.align);
		updated.push("align");
	}
	if (props.sizing_horizontal !== void 0) {
		node.layoutSizingHorizontal = str(props.sizing_horizontal);
		updated.push("sizing_horizontal");
	}
	if (props.sizing_vertical !== void 0) {
		node.layoutSizingVertical = str(props.sizing_vertical);
		updated.push("sizing_vertical");
	}
	if (props.grow !== void 0) {
		node.layoutGrow = num(props.grow);
		updated.push("grow");
	}
	if (props.name !== void 0) {
		node.name = str(props.name);
		updated.push("name");
	}
	if (props.visible !== void 0) {
		node.visible = Boolean(props.visible);
		updated.push("visible");
	}
	if (props.corner_radius !== void 0) {
		node.cornerRadius = num(props.corner_radius);
		updated.push("corner_radius");
	}
	if (props.opacity !== void 0) {
		node.opacity = num(props.opacity);
		updated.push("opacity");
	}
	if (props.auto_resize !== void 0) {
		node.textAutoResize = str(props.auto_resize);
		updated.push("auto_resize");
	}
	if (props.direction !== void 0) {
		node.layoutMode = str(props.direction);
		updated.push("direction");
	}
	return updated;
}
const batchUpdate = defineTool({
	name: "batch_update",
	mutates: true,
	description: "Execute multiple modifications in one call. Each operation is {id, props} where props can include: spacing, padding, padding_horizontal, padding_vertical, counter_align, sizing_horizontal, sizing_vertical, grow, name, visible, corner_radius, auto_resize (for text), direction. Runs all updates with one layout recompute.",
	params: { operations: {
		type: "string",
		description: "JSON array: [{\"id\":\"0:5\",\"props\":{\"spacing\":8}},{\"id\":\"0:6\",\"props\":{\"sizing_horizontal\":\"FILL\",\"grow\":1}}]",
		required: true
	} },
	execute: (figma, { operations }) => {
		let ops;
		try {
			ops = safeDestr(String(operations));
		} catch {
			return { error: "Invalid JSON in operations" };
		}
		if (!Array.isArray(ops)) return { error: "operations must be a JSON array" };
		const results = [];
		const errors = [];
		for (const op of ops) {
			const node = figma.getNodeById(op.id);
			if (!node) {
				errors.push(`Node "${op.id}" not found`);
				continue;
			}
			const updated = applyBatchProps(node, op.props);
			if (updated.length > 0) results.push({
				id: op.id,
				updated
			});
		}
		const out = { updated: results.length };
		if (results.length > 0) out.results = results;
		if (errors.length > 0) out.errors = errors;
		return out;
	}
});
//#endregion
export { batchUpdate };

//# sourceMappingURL=batch.js.map