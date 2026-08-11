//#region src/tools/stock-photo/apply.ts
async function applyPhoto(figma, provider, req) {
	const node = figma.getNodeById(req.id);
	if (!node) return {
		id: req.id,
		error: "Not found"
	};
	if (("children" in node ? node.children : []).length > 0) return {
		id: req.id,
		error: `"${node.name}" has children — use a leaf shape`
	};
	const perPage = Math.min((req.index ?? 0) + 3, 15);
	const orientation = req.orientation ?? "landscape";
	const targetDim = Math.max(node.width, node.height);
	let results;
	try {
		results = await provider.search(req.query, {
			perPage,
			orientation,
			targetDim
		});
	} catch (err) {
		return {
			id: req.id,
			error: err instanceof Error ? err.message : String(err)
		};
	}
	if (results.length === 0) return {
		id: req.id,
		error: `No photos for "${req.query}"`
	};
	const photo = results[Math.min(req.index ?? 0, results.length - 1)];
	let imageBytes;
	try {
		const response = await fetch(photo.url);
		if (!response.ok) return {
			id: req.id,
			error: `Download ${response.status}`
		};
		imageBytes = new Uint8Array(await response.arrayBuffer());
	} catch (err) {
		return {
			id: req.id,
			error: `Download: ${err instanceof Error ? err.message : String(err)}`
		};
	}
	node.fills = [{
		type: "IMAGE",
		color: {
			r: 1,
			g: 1,
			b: 1,
			a: 1
		},
		imageHash: figma.createImage(imageBytes).hash,
		imageScaleMode: "FILL",
		visible: true,
		opacity: 1
	}];
	return {
		id: node.id,
		photo: {
			sourceId: photo.sourceId,
			photographer: photo.photographer,
			width: photo.width,
			height: photo.height,
			provider: provider.name
		}
	};
}
//#endregion
export { applyPhoto };

//# sourceMappingURL=apply.js.map