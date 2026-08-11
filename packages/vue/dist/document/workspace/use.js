import { createDocumentPreviews } from "./previews.js";
import { computed, onBeforeUnmount, onMounted, readonly, ref, shallowRef } from "vue";
import { useEventListener, useIntervalFn } from "@vueuse/core";
import { IS_BROWSER } from "@open-pencil/core/constants";
//#region src/document/workspace/use.ts
function useDocumentWorkspace(options) {
	const documents = shallowRef([]);
	const loading = ref(false);
	const error = shallowRef(null);
	const lastRefreshedAt = shallowRef(null);
	const previews = createDocumentPreviews({
		documents,
		source: options.source,
		previewConcurrency: options.previewConcurrency,
		previewMimeType: options.previewMimeType,
		onPreviewError: options.onPreviewError ? (id, error) => options.onPreviewError?.(id, error) : void 0
	});
	let refreshPromise = null;
	let refreshQueued = false;
	let disposed = false;
	function refresh() {
		if (refreshPromise) return refreshPromise;
		loading.value = true;
		error.value = null;
		const nextRefresh = options.source.refresh().then((items) => {
			if (!disposed && items) {
				previews.reconcile(documents.value, items);
				documents.value = items;
				lastRefreshedAt.value = /* @__PURE__ */ new Date();
			}
		}).catch((reason) => {
			if (!disposed) error.value = reason;
		}).finally(() => {
			loading.value = false;
			refreshPromise = null;
			if (refreshQueued && !disposed) {
				refreshQueued = false;
				refresh();
			}
		});
		refreshPromise = nextRefresh;
		return nextRefresh;
	}
	function invalidate() {
		if (!refreshPromise) return refresh();
		refreshQueued = true;
		return refreshPromise;
	}
	if (options.refreshOnFocus !== false && IS_BROWSER) useEventListener(window, "focus", () => void invalidate());
	if (options.refreshOnReconnect !== false && IS_BROWSER) useEventListener(window, "online", () => void invalidate());
	if (options.refreshInterval && options.refreshInterval > 0) useIntervalFn(() => {
		if (typeof document === "undefined" || document.visibilityState === "visible") invalidate();
	}, options.refreshInterval, {
		immediate: true,
		immediateCallback: false
	});
	let unsubscribeSource = null;
	onMounted(() => {
		unsubscribeSource = options.source.subscribe?.(() => void invalidate()) ?? null;
		refresh();
	});
	onBeforeUnmount(() => {
		unsubscribeSource?.();
		disposed = true;
		previews.dispose();
	});
	return {
		documents: readonly(documents),
		loading: readonly(loading),
		error: readonly(error),
		lastRefreshedAt: readonly(lastRefreshedAt),
		previewUrls: previews.previewUrls,
		previewErrors: previews.previewErrors,
		hasDocuments: computed(() => documents.value.length > 0),
		refresh,
		invalidate,
		clearPreviews: previews.clearPreviews,
		loadPreview: previews.loadPreview,
		previewDirective: previews.previewDirective,
		previewURL: previews.previewURL
	};
}
//#endregion
export { useDocumentWorkspace };

//# sourceMappingURL=use.js.map