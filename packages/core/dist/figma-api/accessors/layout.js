import { raw, updateNode } from "../accessor-utils.js";
//#region src/figma-api/accessors/layout.ts
function graph(target, internals) {
	return target[internals.graph];
}
function parentLayout(target, internals) {
	const node = raw(target, internals);
	if (!node.parentId) return "NONE";
	const parent = graph(target, internals).getNode(node.parentId);
	if (!parent) return "NONE";
	const mode = parent.layoutMode;
	return mode === "HORIZONTAL" || mode === "VERTICAL" ? mode : "NONE";
}
function setLayoutSizing(target, internals, axis, value) {
	const node = raw(target, internals);
	const layout = node.layoutMode !== "NONE" ? node.layoutMode : parentLayout(target, internals);
	const updates = (axis === "HORIZONTAL" ? layout === "VERTICAL" : layout === "HORIZONTAL") ? { counterAxisSizing: value } : { primaryAxisSizing: value };
	if (parentLayout(target, internals) === axis) updates.layoutGrow = value === "FILL" ? 1 : 0;
	updateNode(target, internals, updates);
}
function installLayoutNodeProxyAccessors(prototype, internals) {
	Object.defineProperties(prototype, {
		layoutMode: simpleAccessor(internals, "layoutMode"),
		layoutDirection: {
			get() {
				const node = raw(this, internals);
				return Object.hasOwn(node, "layoutDirection") ? node.layoutDirection : "AUTO";
			},
			set(value) {
				updateNode(this, internals, { layoutDirection: value });
			}
		},
		primaryAxisAlignItems: mappedAccessor(internals, "primaryAxisAlign"),
		counterAxisAlignItems: mappedAccessor(internals, "counterAxisAlign"),
		itemSpacing: simpleAccessor(internals, "itemSpacing"),
		counterAxisSpacing: simpleAccessor(internals, "counterAxisSpacing"),
		paddingTop: simpleAccessor(internals, "paddingTop"),
		paddingRight: simpleAccessor(internals, "paddingRight"),
		paddingBottom: simpleAccessor(internals, "paddingBottom"),
		paddingLeft: simpleAccessor(internals, "paddingLeft"),
		layoutWrap: mappedAccessor(internals, "layoutWrap"),
		primaryAxisSizingMode: axisSizingModeAccessor(internals, "primaryAxisSizing"),
		counterAxisSizingMode: axisSizingModeAccessor(internals, "counterAxisSizing"),
		counterAxisAlignContent: mappedAccessor(internals, "counterAxisAlignContent"),
		itemReverseZIndex: simpleAccessor(internals, "itemReverseZIndex"),
		strokesIncludedInLayout: simpleAccessor(internals, "strokesIncludedInLayout"),
		layoutPositioning: mappedAccessor(internals, "layoutPositioning"),
		layoutGrow: simpleAccessor(internals, "layoutGrow"),
		layoutAlign: {
			get() {
				const node = raw(this, internals);
				return node.layoutAlignSelf === "AUTO" ? "INHERIT" : node.layoutAlignSelf;
			},
			set(value) {
				const mapped = value === "INHERIT" ? "AUTO" : value;
				updateNode(this, internals, { layoutAlignSelf: mapped });
			}
		},
		layoutSizingHorizontal: layoutSizingAccessor(internals, "HORIZONTAL"),
		layoutSizingVertical: layoutSizingAccessor(internals, "VERTICAL"),
		constraints: {
			get() {
				const node = raw(this, internals);
				return {
					horizontal: node.horizontalConstraint,
					vertical: node.verticalConstraint
				};
			},
			set(value) {
				updateNode(this, internals, {
					horizontalConstraint: value.horizontal,
					verticalConstraint: value.vertical
				});
			}
		},
		minWidth: simpleAccessor(internals, "minWidth"),
		maxWidth: simpleAccessor(internals, "maxWidth"),
		minHeight: simpleAccessor(internals, "minHeight"),
		maxHeight: simpleAccessor(internals, "maxHeight")
	});
}
function axisSizingModeAccessor(internals, field) {
	return {
		get() {
			const value = raw(this, internals)[field];
			return value === "HUG" ? "AUTO" : value;
		},
		set(value) {
			const mapped = value === "AUTO" ? "HUG" : value;
			updateNode(this, internals, { [field]: mapped });
		}
	};
}
function layoutSizingAccessor(internals, axis) {
	return {
		get() {
			const node = raw(this, internals);
			const layout = node.layoutMode !== "NONE" ? node.layoutMode : parentLayout(this, internals);
			if (layout === "NONE") return "FIXED";
			return layout === axis ? node.primaryAxisSizing : node.counterAxisSizing;
		},
		set(value) {
			setLayoutSizing(this, internals, axis, value);
		}
	};
}
function simpleAccessor(internals, field) {
	return {
		get() {
			return raw(this, internals)[field];
		},
		set(value) {
			updateNode(this, internals, { [field]: value });
		}
	};
}
function mappedAccessor(internals, field) {
	return {
		get() {
			return raw(this, internals)[field];
		},
		set(value) {
			updateNode(this, internals, { [field]: value });
		}
	};
}
//#endregion
export { installLayoutNodeProxyAccessors };

//# sourceMappingURL=layout.js.map