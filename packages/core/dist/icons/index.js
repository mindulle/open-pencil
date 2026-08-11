import { buildIconData } from "./svg.js";
import { fetchIconifyCollection, searchIconify } from "./api.js";
//#region src/icons/index.ts
const iconCache = /* @__PURE__ */ new Map();
function clearIconCache() {
	iconCache.clear();
}
function parseIconName(name) {
	const colonIdx = name.indexOf(":");
	if (colonIdx === -1) throw new Error(`Invalid icon name "${name}". Use prefix:name format (e.g. lucide:heart, mdi:home)`);
	return {
		prefix: name.slice(0, colonIdx),
		iconName: name.slice(colonIdx + 1)
	};
}
async function fetchIcon(name, size = 24) {
	const result = (await fetchIcons([name], size)).get(name);
	if (!result) throw new Error(`Icon "${name}" not found. Check the name at https://icon-sets.iconify.design/`);
	return result;
}
async function fetchIcons(names, size = 24) {
	const results = /* @__PURE__ */ new Map();
	const toFetch = /* @__PURE__ */ new Map();
	for (const name of names) {
		const cacheKey = `${name}@${size}`;
		const cached = iconCache.get(cacheKey);
		if (cached) {
			results.set(name, cached);
			continue;
		}
		const { prefix, iconName } = parseIconName(name);
		const group = toFetch.get(prefix) ?? [];
		group.push(iconName);
		toFetch.set(prefix, group);
	}
	const fetches = [...toFetch.entries()].map(async ([prefix, iconNames]) => {
		const data = await fetchIconifyCollection(prefix, iconNames);
		const defaultW = data.width ?? 24;
		const defaultH = data.height ?? 24;
		for (const iconName of iconNames) {
			const fullName = `${prefix}:${iconName}`;
			let entry = data.icons[iconName];
			if (!entry) {
				const alias = data.aliases?.[iconName];
				if (alias) entry = data.icons[alias.parent];
			}
			if (!entry) continue;
			const iconData = buildIconData(entry, prefix, iconName, defaultW, defaultH, size);
			iconCache.set(`${fullName}@${size}`, iconData);
			results.set(fullName, iconData);
		}
	});
	await Promise.all(fetches);
	return results;
}
async function searchIconsBatch(queries, options) {
	const results = /* @__PURE__ */ new Map();
	await Promise.all(queries.map(async (query) => {
		const result = await searchIconify(query, options);
		results.set(query, result);
	}));
	return results;
}
//#endregion
export { clearIconCache, fetchIcon, fetchIcons, searchIconify as searchIcons, searchIconsBatch };

//# sourceMappingURL=index.js.map