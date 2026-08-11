//#region src/xpath.ts
const NODE_TYPES = {
	ELEMENT_NODE: 1,
	ATTRIBUTE_NODE: 2,
	TEXT_NODE: 3,
	DOCUMENT_NODE: 9
};
const QUERYABLE_ATTRS = [
	"name",
	"width",
	"height",
	"x",
	"y",
	"visible",
	"opacity",
	"cornerRadius",
	"fontSize",
	"fontFamily",
	"fontWeight",
	"textDirection",
	"layoutMode",
	"layoutDirection",
	"itemSpacing",
	"paddingTop",
	"paddingBottom",
	"paddingLeft",
	"paddingRight",
	"strokeWeight",
	"rotation",
	"locked",
	"blendMode",
	"text",
	"lineHeight",
	"letterSpacing"
];
function wrapNode(_graph, node, parent) {
	return {
		nodeType: NODE_TYPES.ELEMENT_NODE,
		nodeName: node.type,
		localName: node.type,
		namespaceURI: null,
		prefix: null,
		_sceneNode: node,
		_parent: parent
	};
}
function createDocument(graph, rootNode) {
	const doc = {
		nodeType: NODE_TYPES.DOCUMENT_NODE,
		nodeName: "#document",
		documentElement: null
	};
	const root = wrapNode(graph, rootNode, doc);
	doc.documentElement = root;
	doc._children = [root];
	return doc;
}
function getAttrs(wrapped) {
	if (wrapped._attrs) return wrapped._attrs;
	const node = wrapped._sceneNode;
	const attrs = [];
	for (const attrName of QUERYABLE_ATTRS) if (attrName in node) {
		const value = Reflect.get(node, attrName);
		if (value === void 0 || value === null || typeof value === "symbol") continue;
		const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
		attrs.push({
			nodeType: NODE_TYPES.ATTRIBUTE_NODE,
			nodeName: attrName,
			name: attrName,
			localName: attrName,
			namespaceURI: null,
			prefix: null,
			value: stringValue,
			ownerElement: wrapped
		});
	}
	wrapped._attrs = attrs;
	return attrs;
}
function getChildren(graph, wrapped) {
	if (wrapped._children) return wrapped._children;
	wrapped._children = wrapped._sceneNode.childIds.map((id) => graph.getNode(id)).filter((n) => n !== void 0).map((child) => wrapNode(graph, child, wrapped));
	return wrapped._children;
}
function isDocument(node) {
	return node.nodeType === NODE_TYPES.DOCUMENT_NODE;
}
function siblingNode(graph, node, offset) {
	if (isDocument(node)) return null;
	const parent = node._parent;
	if (!parent || isDocument(parent)) return null;
	const siblings = getChildren(graph, parent);
	const index = siblings.indexOf(node);
	if (index === -1) return null;
	return siblings[index + offset] ?? null;
}
function createDomFacade(graph) {
	return {
		getAllAttributes(node) {
			if (isDocument(node)) return [];
			return getAttrs(node);
		},
		getAttribute(node, attributeName) {
			if (isDocument(node)) return null;
			const sceneNode = node._sceneNode;
			if (attributeName in sceneNode) {
				const value = Reflect.get(sceneNode, attributeName);
				if (value === void 0 || value === null || typeof value === "symbol") return null;
				return typeof value === "object" ? JSON.stringify(value) : String(value);
			}
			return null;
		},
		getChildNodes(node) {
			if (isDocument(node)) return node._children ?? [];
			return getChildren(graph, node);
		},
		getData(node) {
			return node.value;
		},
		getFirstChild(node) {
			if (isDocument(node)) return node.documentElement;
			return getChildren(graph, node)[0] ?? null;
		},
		getLastChild(node) {
			if (isDocument(node)) return node.documentElement;
			const children = getChildren(graph, node);
			return children[children.length - 1] ?? null;
		},
		getNextSibling(node) {
			return siblingNode(graph, node, 1);
		},
		getParentNode(node) {
			if (isDocument(node)) return null;
			return node._parent ?? null;
		},
		getPreviousSibling(node) {
			return siblingNode(graph, node, -1);
		}
	};
}
async function queryByXPath(graph, selector, options = {}) {
	const { limit = 1e3 } = options;
	const pages = graph.getPages();
	const targetPages = options.page ? pages.filter((p) => p.name === options.page) : pages;
	if (targetPages.length === 0) return [];
	const { evaluateXPathToNodes } = await import("fontoxpath");
	const domFacade = createDomFacade(graph);
	const results = [];
	for (const page of targetPages) {
		const nodes = evaluateXPathToNodes(selector, createDocument(graph, page), domFacade);
		for (const node of nodes) {
			if (results.length >= limit) break;
			const sceneNode = node._sceneNode;
			if (sceneNode.type !== "CANVAS") results.push(sceneNode);
		}
		if (results.length >= limit) break;
	}
	return results;
}
/**
* Build an XPath selector that uniquely identifies a node in its page.
*
* Strategy: walk from the node up to the page root, building path segments.
* Each segment uses the node type as the element name. If the name is
* unique among siblings of the same type, use `[@name='...']`.
* Otherwise fall back to a positional predicate `[n]`.
*/
function nodeToXPath(graph, nodeId) {
	const node = graph.getNode(nodeId);
	if (!node) return null;
	const segments = [];
	let current = node;
	for (;;) {
		if (current.type === "CANVAS") break;
		const parentId = current.parentId;
		const parent = parentId ? graph.getNode(parentId) : void 0;
		segments.unshift(buildSegment(graph, current, parent));
		if (!parent || parent.type === "CANVAS") break;
		current = parent;
	}
	return segments.length > 0 ? "//" + segments.join("/") : null;
}
function buildSegment(graph, node, parent) {
	const tag = node.type;
	const escaped = escapeXPathName(node.name);
	if (!parent) return `${tag}[@name=${escaped}]`;
	const siblings = parent.childIds.map((id) => graph.getNode(id)).filter((n) => n !== void 0 && n.type === tag);
	if (siblings.filter((s) => s.name === node.name).length <= 1) return `${tag}[@name=${escaped}]`;
	return `${tag}[${siblings.findIndex((s) => s.id === node.id) + 1}]`;
}
function escapeXPathName(s) {
	if (!s.includes("'")) return `'${s}'`;
	if (!s.includes("\"")) return `"${s}"`;
	return `concat(${s.split("'").map((p) => `'${p}'`).join(", \"'\", ")})`;
}
async function matchByXPath(graph, selector, node) {
	const { evaluateXPathToBoolean } = await import("fontoxpath");
	const domFacade = createDomFacade(graph);
	const wrapped = wrapNode(graph, node);
	try {
		return evaluateXPathToBoolean(`self::*[${selector}]`, wrapped, domFacade);
	} catch {
		return false;
	}
}
//#endregion
export { matchByXPath, nodeToXPath, queryByXPath };

//# sourceMappingURL=xpath.js.map