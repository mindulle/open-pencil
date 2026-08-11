import { readonly, ref, shallowRef } from "vue";
//#region src/document/workspace/previews.ts
function createDocumentPreviews(options) {
	const previewUrls = ref({});
	const previewErrors = shallowRef({});
	const previewCleanups = /* @__PURE__ */ new WeakMap();
	const previewGenerations = /* @__PURE__ */ new Map();
	const previewQueue = [];
	const queued = /* @__PURE__ */ new Set();
	const active = /* @__PURE__ */ new Set();
	const requestedConcurrency = options.previewConcurrency ?? 6;
	const concurrency = Number.isFinite(requestedConcurrency) ? Math.max(1, Math.floor(requestedConcurrency)) : 6;
	let disposed = false;
	function removeURL(id) {
		previewGenerations.set(id, (previewGenerations.get(id) ?? 0) + 1);
		const url = previewUrls.value[id];
		if (!url) return;
		URL.revokeObjectURL(url);
		previewUrls.value = Object.fromEntries(Object.entries(previewUrls.value).filter(([previewId]) => previewId !== id));
	}
	function replaceURL(id, bytes) {
		if (disposed) return;
		const previous = previewUrls.value[id];
		if (previous) URL.revokeObjectURL(previous);
		const blobBytes = Uint8Array.from(bytes);
		previewUrls.value = {
			...previewUrls.value,
			[id]: URL.createObjectURL(new Blob([blobBytes.buffer], { type: options.previewMimeType ?? "image/png" }))
		};
	}
	function clearError(id) {
		if (!(id in previewErrors.value)) return;
		previewErrors.value = Object.fromEntries(Object.entries(previewErrors.value).filter(([previewId]) => previewId !== id));
	}
	async function runLoad(id, generation) {
		try {
			const bytes = await options.source.loadPreview(id);
			if (bytes?.byteLength && generation === (previewGenerations.get(id) ?? 0)) {
				clearError(id);
				replaceURL(id, bytes);
			}
		} catch (error) {
			if (!disposed && generation === (previewGenerations.get(id) ?? 0)) {
				previewErrors.value = {
					...previewErrors.value,
					[id]: error
				};
				try {
					options.onPreviewError?.(id, error);
				} catch (callbackError) {
					console.error("[Vue] Preview error callback failed:", callbackError);
				}
			}
		} finally {
			active.delete(id);
			if (!disposed && generation !== (previewGenerations.get(id) ?? 0) && options.documents.value.some((item) => item.id === id)) loadPreview(id);
			drainQueue();
		}
	}
	function drainQueue() {
		while (active.size < concurrency) {
			const id = previewQueue.shift();
			if (!id) break;
			if (!queued.delete(id)) continue;
			if (active.has(id) || previewUrls.value[id]) continue;
			active.add(id);
			runLoad(id, previewGenerations.get(id) ?? 0);
		}
	}
	function loadPreview(id) {
		if (previewUrls.value[id] || active.has(id) || queued.has(id)) return;
		clearError(id);
		queued.add(id);
		previewQueue.push(id);
		drainQueue();
	}
	function reconcile(previousItems, items) {
		const previous = new Map(previousItems.map((item) => [item.id, item.updatedAt]));
		const current = new Map(items.map((item) => [item.id, item.updatedAt]));
		const trackedIds = /* @__PURE__ */ new Set([
			...Object.keys(previewUrls.value),
			...active,
			...queued,
			...Object.keys(previewErrors.value)
		]);
		for (const id of trackedIds) {
			if (previous.get(id) === current.get(id)) continue;
			removeURL(id);
			clearError(id);
			if (!current.has(id)) {
				queued.delete(id);
				continue;
			}
			if (active.has(id) || queued.has(id)) continue;
			queued.add(id);
			previewQueue.push(id);
		}
		drainQueue();
	}
	function clearPreviews() {
		const ids = /* @__PURE__ */ new Set([
			...Object.keys(previewUrls.value),
			...active,
			...queued,
			...previewGenerations.keys()
		]);
		for (const id of ids) removeURL(id);
		previewQueue.length = 0;
		queued.clear();
		previewErrors.value = {};
	}
	function observePreview(element, id) {
		if (!element || typeof IntersectionObserver === "undefined") {
			loadPreview(id);
			return () => void 0;
		}
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				loadPreview(id);
				observer.disconnect();
			}
		}, { rootMargin: "240px" });
		observer.observe(element);
		return () => observer.disconnect();
	}
	function stopObserving(element) {
		previewCleanups.get(element)?.();
		previewCleanups.delete(element);
	}
	const previewDirective = {
		mounted(element, binding) {
			previewCleanups.set(element, observePreview(element, binding.value));
		},
		updated(element, binding) {
			if (binding.value === binding.oldValue) return;
			stopObserving(element);
			previewCleanups.set(element, observePreview(element, binding.value));
		},
		unmounted(element) {
			stopObserving(element);
		}
	};
	function dispose() {
		disposed = true;
		clearPreviews();
	}
	return {
		previewUrls: readonly(previewUrls),
		previewErrors: readonly(previewErrors),
		clearPreviews,
		dispose,
		loadPreview,
		previewDirective,
		previewURL: (id) => previewUrls.value[id] ?? null,
		reconcile
	};
}
//#endregion
export { createDocumentPreviews };

//# sourceMappingURL=previews.js.map