import { detectIssues } from "./issues.js";
import { detectRole } from "./roles.js";
import { describeLayout, describeVisual, summarizeContainer, summarizeText } from "./summaries.js";
//#region src/tools/describe/tree.ts
function describeChild(node, graph, depth, gridSize) {
	const role = detectRole(node);
	const summary = node.type === "TEXT" ? summarizeText(node, graph) : summarizeContainer(node, graph);
	const result = {
		role,
		name: node.name,
		summary,
		id: node.id
	};
	const issues = detectIssues(node, gridSize, graph);
	if (issues.length > 0) result.issues = issues;
	if (depth > 0 && node.childIds.length > 0) {
		const kids = [];
		for (const childId of node.childIds) {
			const child = graph.getNode(childId);
			if (!child || !child.visible) continue;
			kids.push(describeChild(child, graph, depth - 1, gridSize));
		}
		if (kids.length > 0) result.children = kids;
	}
	return result;
}
function describeOneNode(figma, nodeId, depth, gridSize) {
	const raw = figma.graph.getNode(nodeId);
	if (!raw) return {
		id: nodeId,
		error: `Node "${nodeId}" not found`
	};
	const role = detectRole(raw);
	const visual = describeVisual(raw, figma.graph);
	const layout = describeLayout(raw);
	const issues = detectIssues(raw, gridSize, figma.graph);
	const children = [];
	for (const childId of raw.childIds) {
		const child = figma.graph.getNode(childId);
		if (!child || !child.visible) continue;
		children.push(describeChild(child, figma.graph, depth - 1, gridSize));
	}
	const result = {
		id: raw.id,
		name: raw.name,
		type: raw.type,
		role,
		size: `${raw.width}×${raw.height}`,
		visual
	};
	if (layout) result.layout = layout;
	if (children.length > 0) result.children = children;
	if (issues.length > 0) result.issues = issues;
	return result;
}
function countDescendants(graph, nodeId) {
	const node = graph.getNode(nodeId);
	if (!node) return 0;
	let count = 0;
	for (const childId of node.childIds) count += 1 + countDescendants(graph, childId);
	return count;
}
function autoDepth(graph, nodeId) {
	const size = countDescendants(graph, nodeId);
	if (size <= 15) return 4;
	if (size <= 40) return 3;
	if (size <= 100) return 2;
	return 1;
}
//#endregion
export { autoDepth, describeOneNode };

//# sourceMappingURL=tree.js.map