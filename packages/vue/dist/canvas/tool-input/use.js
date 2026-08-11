import { getNodeEditState, handleNodeEditDown } from "../node-edit-input/use.js";
import { startPenInput } from "../pen-input/use.js";
import { buildResizeCursor, cornerRotationCursor, getHitHandleByMatrix, hitTestCornerRotationByMatrix } from "../pointer/use.js";
import { DEFAULT_TEXT_HEIGHT, DEFAULT_TEXT_WIDTH } from "@open-pencil/core/constants";
import { getAbsoluteRotation } from "@open-pencil/scene-graph/coordinate";
import { cloneVectorNetwork } from "@open-pencil/scene-graph";
import { copyGeometryPaths, scaleGeometryPaths } from "@open-pencil/scene-graph/copy";
import { collectResizeDescendants, computeConstrainedResizeChanges, scaleVectorNetworkForResize } from "@open-pencil/scene-graph/resize";
import { computeAllLayouts } from "@open-pencil/core/layout";
import { useStore } from "@nanostores/vue";
import { createI18n, localeFrom, params } from "@nanostores/i18n";
import { atom, onStart } from "nanostores";
//#region src/shared/input/types.ts
const TOOL_TO_NODE = {
	FRAME: "FRAME",
	SECTION: "SECTION",
	RECTANGLE: "RECTANGLE",
	ELLIPSE: "ELLIPSE",
	LINE: "LINE",
	POLYGON: "POLYGON",
	STAR: "STAR",
	TEXT: "TEXT"
};
//#endregion
//#region src/shared/input/draw.ts
function startTextDraw(cx, cy, editor, setDrag) {
	editor.undo.beginBatch("Create text");
	const nodeId = editor.createShape("TEXT", cx, cy, 0, 0);
	editor.graph.updateNode(nodeId, { text: "" });
	editor.select([nodeId]);
	setDrag({
		type: "draw",
		startX: cx,
		startY: cy,
		nodeId
	});
}
function startShapeDraw(cx, cy, editor, setDrag) {
	const nodeType = TOOL_TO_NODE[editor.state.activeTool];
	if (!nodeType) return;
	editor.undo.beginBatch("Create shape");
	const nodeId = editor.createShape(nodeType, cx, cy, 0, 0);
	editor.select([nodeId]);
	setDrag({
		type: "draw",
		startX: cx,
		startY: cy,
		nodeId
	});
}
function handleDrawMove(d, cx, cy, shiftKey, editor) {
	let w = cx - d.startX;
	let h = cy - d.startY;
	if (shiftKey) {
		const size = Math.max(Math.abs(w), Math.abs(h));
		w = Math.sign(w) * size;
		h = Math.sign(h) * size;
	}
	editor.updateNode(d.nodeId, {
		x: w < 0 ? d.startX + w : d.startX,
		y: h < 0 ? d.startY + h : d.startY,
		width: Math.abs(w),
		height: Math.abs(h)
	});
}
function handleDrawUp(d, editor) {
	const node = editor.graph.getNode(d.nodeId);
	if (node?.type === "TEXT") {
		const isPointText = node.width < 2 && node.height < 2;
		editor.updateNode(d.nodeId, {
			width: isPointText ? DEFAULT_TEXT_WIDTH : node.width,
			height: isPointText ? DEFAULT_TEXT_HEIGHT : node.height,
			textAutoResize: isPointText ? "WIDTH_AND_HEIGHT" : "NONE"
		});
	} else if (node && node.width < 2 && node.height < 2) editor.updateNode(d.nodeId, {
		width: 100,
		height: 100
	});
	if (node?.type === "SECTION") editor.adoptNodesIntoSection(node.id);
	editor.commitResize(d.nodeId, {
		x: d.startX,
		y: d.startY,
		width: 0,
		height: 0
	});
	editor.undo.commitBatch();
	editor.setTool("SELECT");
	if (node?.type === "TEXT") editor.startTextEditing(node.id);
}
//#endregion
//#region src/shared/input/pan.ts
function startPanDrag(event, setDrag, editor) {
	setDrag({
		type: "pan",
		startScreenX: event.clientX,
		startScreenY: event.clientY,
		startPanX: editor.state.panX,
		startPanY: editor.state.panY
	});
}
//#endregion
//#region src/shared/input/select/hit.ts
function resolveHit(cx, cy, editor, fns) {
	const titleHit = fns.hitTestFrameTitle(cx, cy) ?? fns.hitTestSectionTitle(cx, cy) ?? fns.hitTestComponentLabel(cx, cy);
	if (titleHit) return titleHit;
	const hit = fns.hitTestInScope(cx, cy, false);
	if (hit) return hit;
	const scopeId = editor.state.enteredContainerId;
	if (!scopeId) return null;
	if (fns.isInsideContainerBounds(cx, cy, scopeId)) {
		editor.clearSelection();
		return null;
	}
	editor.exitContainer();
	const afterExit = fns.hitTestInScope(cx, cy, false);
	if (afterExit) return afterExit;
	if (editor.state.enteredContainerId) editor.exitContainer();
	return null;
}
//#endregion
//#region src/shared/input/select/hover.ts
function getResizeCursorForSelection(cx, cy, editor) {
	for (const id of editor.state.selectedIds) {
		const node = editor.graph.getNode(id);
		if (!node) continue;
		const handleHit = getHitHandleByMatrix(cx, cy, node, editor.graph, editor.renderer?.zoom ?? 1);
		if (handleHit?.handle) return buildResizeCursor(handleHit.rotation);
	}
	return null;
}
function getRotationCursorForSelection(cx, cy, editor) {
	if (editor.state.selectedIds.size !== 1) return null;
	const id = [...editor.state.selectedIds][0];
	const node = editor.graph.getNode(id);
	if (!node) return null;
	const corner = hitTestCornerRotationByMatrix(cx, cy, node, editor.graph, editor.renderer?.zoom ?? 1);
	if (!corner) return null;
	return cornerRotationCursor(corner, getAbsoluteRotation(node, editor.graph));
}
function updateHoveredNode(cx, cy, editor, fns) {
	const hit = fns.hitTestSectionTitle(cx, cy) ?? fns.hitTestComponentLabel(cx, cy) ?? fns.hitTestInScope(cx, cy, false);
	const editNodeId = getNodeEditState(editor)?.nodeId;
	editor.setHoveredNode(hit && !editor.state.selectedIds.has(hit.id) && hit.id !== editNodeId ? hit.id : null);
}
function updateHoverCursor(cx, cy, editor, fns) {
	if (getNodeEditState(editor)) {
		editor.setHoveredNode(null);
		return null;
	}
	const cursor = getResizeCursorForSelection(cx, cy, editor) ?? getRotationCursorForSelection(cx, cy, editor);
	updateHoveredNode(cx, cy, editor, fns);
	return cursor;
}
//#endregion
//#region src/shared/input/resize/rect.ts
function constrainToAspectRatio(handle, origRect, width, height, dx, dy) {
	let x = handle.includes("w") ? origRect.x + origRect.width - Math.abs(width) : origRect.x;
	const isTop = handle === "nw" || handle === "n" || handle === "ne";
	let y = isTop ? origRect.y + origRect.height - Math.abs(height) : origRect.y;
	const aspect = origRect.width / origRect.height;
	if (handle === "n" || handle === "s") {
		width = Math.abs(height) * aspect;
		x = origRect.x + (origRect.width - width) / 2;
	} else if (handle === "e" || handle === "w") {
		height = Math.abs(width) / aspect;
		y = origRect.y + (origRect.height - height) / 2;
	} else if (Math.abs(dx) > Math.abs(dy)) {
		height = Math.abs(width) / aspect * Math.sign(height || 1);
		if (isTop) y = origRect.y + origRect.height - Math.abs(height);
	} else {
		width = Math.abs(height) * aspect * Math.sign(width || 1);
		if (handle.includes("w")) x = origRect.x + origRect.width - Math.abs(width);
	}
	return {
		x,
		y,
		width,
		height
	};
}
function calculateResizeRect(handle, origRect, dx, dy, constrain) {
	let { x, y, width, height } = origRect;
	const moveLeft = handle.includes("w");
	const moveRight = handle.includes("e");
	const moveTop = handle === "nw" || handle === "n" || handle === "ne";
	const moveBottom = handle === "sw" || handle === "s" || handle === "se";
	if (moveRight) width = origRect.width + dx;
	if (moveLeft) {
		x = origRect.x + dx;
		width = origRect.width - dx;
	}
	if (moveBottom) height = origRect.height + dy;
	if (moveTop) {
		y = origRect.y + dy;
		height = origRect.height - dy;
	}
	if (constrain && origRect.width > 0 && origRect.height > 0) ({x, y, width, height} = constrainToAspectRatio(handle, origRect, width, height, dx, dy));
	if (width < 0) {
		x += width;
		width = -width;
	}
	if (height < 0) {
		y += height;
		height = -height;
	}
	return {
		x: Math.round(x),
		y: Math.round(y),
		width: Math.round(Math.max(1, width)),
		height: Math.round(Math.max(1, height))
	};
}
//#endregion
//#region src/shared/input/resize/start.ts
function tryStartResize(cx, cy, editor) {
	for (const id of editor.state.selectedIds) {
		const node = editor.graph.getNode(id);
		if (!node || node.locked) continue;
		const handleResult = getHitHandleByMatrix(cx, cy, node, editor.graph, editor.renderer?.zoom);
		if (handleResult) return {
			type: "resize",
			handle: handleResult.handle,
			startX: cx,
			startY: cy,
			origRect: {
				x: node.x,
				y: node.y,
				width: node.width,
				height: node.height
			},
			nodeId: id,
			origVectorNetwork: node.vectorNetwork ? cloneVectorNetwork(node.vectorNetwork) : null,
			origFillGeometry: copyGeometryPaths(node.fillGeometry),
			origStrokeGeometry: copyGeometryPaths(node.strokeGeometry),
			origChildren: collectResizeDescendants(editor.graph, id)
		};
	}
	return null;
}
//#endregion
//#region src/shared/input/resize.ts
function resizeChanges(d, cx, cy, constrain) {
	const { origRect } = d;
	const newRect = calculateResizeRect(d.handle, origRect, cx - d.startX, cy - d.startY, constrain);
	const changes = { ...newRect };
	const resizedVectorNetwork = scaleVectorNetworkForResize(d.origVectorNetwork, origRect.width, origRect.height, newRect.width, newRect.height);
	if (resizedVectorNetwork) changes.vectorNetwork = resizedVectorNetwork;
	if (origRect.width > 0 && origRect.height > 0) {
		const scaleX = newRect.width / origRect.width;
		const scaleY = newRect.height / origRect.height;
		if (scaleX !== 1 || scaleY !== 1) {
			if (d.origFillGeometry.length > 0) changes.fillGeometry = scaleGeometryPaths(d.origFillGeometry, scaleX, scaleY);
			if (d.origStrokeGeometry.length > 0) changes.strokeGeometry = scaleGeometryPaths(d.origStrokeGeometry, scaleX, scaleY);
		}
	}
	return {
		changes,
		newRect
	};
}
function applyConstrainedChildren(d, newRect, editor) {
	if (!d.origChildren || d.origRect.width <= 0 || d.origRect.height <= 0) return;
	const changes = computeConstrainedResizeChanges(editor.graph, d.nodeId, d.origRect, newRect, d.origChildren);
	for (const [childId, childChanges] of changes) {
		editor.graph.updateNodePreview(childId, childChanges);
		editor.renderer?.invalidateVectorPath(childId);
	}
}
function applyResize(d, cx, cy, constrain, editor) {
	const { changes, newRect } = resizeChanges(d, cx, cy, constrain);
	editor.graph.updateNodePreview(d.nodeId, changes);
	applyConstrainedChildren(d, newRect, editor);
	editor.graph.runPreviewUpdates(() => computeAllLayouts(editor.graph, d.nodeId));
	applyConstrainedChildren(d, newRect, editor);
	editor.graph.runPreviewUpdates(() => computeAllLayouts(editor.graph, d.nodeId));
	editor.requestRepaint();
}
function commitResizePreview(d, editor) {
	const node = editor.graph.getNode(d.nodeId);
	if (!node) return;
	const finalChanges = {
		x: node.x,
		y: node.y,
		width: node.width,
		height: node.height
	};
	if (node.vectorNetwork) finalChanges.vectorNetwork = cloneVectorNetwork(node.vectorNetwork);
	finalChanges.fillGeometry = copyGeometryPaths(node.fillGeometry);
	finalChanges.strokeGeometry = copyGeometryPaths(node.strokeGeometry);
	if (d.origChildren) {
		const finalChildren = /* @__PURE__ */ new Map();
		for (const [childId] of d.origChildren) {
			const child = editor.graph.getNode(childId);
			if (!child) continue;
			const final = {
				x: child.x,
				y: child.y,
				width: child.width,
				height: child.height
			};
			if (child.vectorNetwork) final.vectorNetwork = cloneVectorNetwork(child.vectorNetwork);
			final.fillGeometry = copyGeometryPaths(child.fillGeometry);
			final.strokeGeometry = copyGeometryPaths(child.strokeGeometry);
			finalChildren.set(childId, final);
		}
		editor.graph.updateNodePreview(d.nodeId, d.origRect);
		for (const [childId, orig] of d.origChildren) editor.graph.updateNodePreview(childId, orig);
		editor.updateNode(d.nodeId, finalChanges);
		for (const [childId, final] of finalChildren) editor.updateNode(childId, final);
		editor.commitGroupResize(d.nodeId, d.origRect, d.origChildren);
		editor.requestRepaint();
	} else {
		editor.graph.updateNodePreview(d.nodeId, d.origRect);
		editor.updateNode(d.nodeId, finalChanges);
		editor.commitResize(d.nodeId, {
			...d.origRect,
			vectorNetwork: d.origVectorNetwork,
			fillGeometry: d.origFillGeometry,
			strokeGeometry: d.origStrokeGeometry
		});
	}
}
//#endregion
//#region src/i18n/locale.ts
const AVAILABLE_LOCALES = [
	"en",
	"de",
	"es",
	"fr",
	"it",
	"ja",
	"pl",
	"ru",
	"zh-CN"
];
const TRANSLATED_LOCALES = [
	"de",
	"es",
	"fr",
	"it",
	"ja",
	"pl",
	"ru",
	"zh-CN"
];
const LOCALE_DIR_NAMES = {
	de: "de",
	es: "es",
	fr: "fr",
	it: "it",
	ja: "ja",
	pl: "pl",
	ru: "ru",
	"zh-CN": "zh-cn"
};
const LOCALE_LABELS = {
	en: "English",
	de: "Deutsch",
	es: "Español",
	fr: "Français",
	it: "Italiano",
	ja: "日本語",
	pl: "Polski",
	ru: "Русский",
	"zh-CN": "中文（简体）"
};
const LOCALE_STORAGE_KEY = "open-pencil-locale";
const localeSetting = atom(void 0);
function resolveBrowserLocale(languages) {
	const localesByCode = new Map(AVAILABLE_LOCALES.map((code) => [code.toLowerCase(), code]));
	for (const language of languages) {
		const normalized = language.toLowerCase();
		const exact = localesByCode.get(normalized);
		if (exact) return exact;
		const base = normalized.split("-")[0];
		const baseLocale = localesByCode.get(base);
		if (baseLocale) return baseLocale;
	}
	return "en";
}
const browserLocale = atom("en");
onStart(browserLocale, () => {
	if (typeof navigator === "undefined") return;
	const browserLanguages = Array.isArray(navigator.languages) ? navigator.languages : [];
	const languages = browserLanguages.length > 0 ? browserLanguages : [navigator.language || "en"];
	browserLocale.set(resolveBrowserLocale(languages));
});
const locale = localeFrom(localeSetting, browserLocale);
function getLocalStorage() {
	if (typeof localStorage === "undefined") return null;
	if (typeof localStorage.getItem !== "function") return null;
	if (typeof localStorage.setItem !== "function") return null;
	return localStorage;
}
function setLocale(code) {
	localeSetting.set(code);
	getLocalStorage()?.setItem(LOCALE_STORAGE_KEY, code);
}
const saved = getLocalStorage()?.getItem(LOCALE_STORAGE_KEY);
if (saved && AVAILABLE_LOCALES.includes(saved)) localeSetting.set(saved);
//#endregion
//#region src/i18n/create.ts
const localeLoaders = {
	de: () => import("../../de.js"),
	es: () => import("../../es.js"),
	fr: () => import("../../fr.js"),
	it: () => import("../../it.js"),
	ja: () => import("../../ja.js"),
	pl: () => import("../../pl.js"),
	ru: () => import("../../ru.js"),
	"zh-CN": () => import("../../zh-cn.js")
};
const i18n = createI18n(locale, {
	baseLocale: "en",
	async get(code) {
		if (code === "en") return {};
		return (await localeLoaders[code]()).default;
	}
});
//#endregion
//#region src/i18n/messages/commands.ts
const commandMessageDefaults = {
	undo: "Undo",
	redo: "Redo",
	selectAll: "Select all",
	selectInverse: "Select inverse",
	duplicate: "Duplicate",
	delete: "Delete",
	group: "Group",
	groupSelection: "Group selection",
	frameSelection: "Frame selection",
	ungroup: "Ungroup",
	createComponent: "Create component",
	createComponentSet: "Create component set",
	createInstance: "Create instance",
	detachInstance: "Detach instance",
	goToMainComponent: "Go to main component",
	addAutoLayout: "Add auto layout",
	useAsMask: "Use as mask",
	removeMask: "Remove mask",
	bringForward: "Bring forward",
	bringToFront: "Bring to front",
	sendBackward: "Send backward",
	sendToBack: "Send to back",
	showHide: "Show/Hide",
	lockUnlock: "Lock/Unlock",
	unionSelection: "Union selection",
	subtractSelection: "Subtract selection",
	intersectSelection: "Intersect selection",
	excludeSelection: "Exclude selection",
	flattenSelection: "Flatten",
	outlineText: "Outline text",
	outlineStroke: "Outline stroke",
	booleanOperations: "Boolean operations",
	flipHorizontal: "Flip horizontal",
	flipVertical: "Flip vertical",
	distributeHorizontal: "Distribute horizontal spacing",
	distributeVertical: "Distribute vertical spacing",
	moveToPage: "Move to page",
	setOpacity: "Set opacity",
	zoomTo100: "Zoom to 100%",
	zoomToFit: "Zoom to fit",
	zoomToSelection: "Zoom to selection"
};
const commandMessages = i18n("commands", commandMessageDefaults);
//#endregion
//#region src/i18n/messages/dialogs.ts
const dialogMessageDefaults = {
	cancel: "Cancel",
	apply: "Apply",
	close: "Close",
	rename: "Rename",
	renameLayers: params("Rename {count} layers"),
	renamePreview: "Preview",
	renameMatch: "Match",
	renameTo: "Rename to",
	renameCurrentName: "Current name",
	renameNumberAscending: "Number ↑",
	renameNumberDescending: "Number ↓",
	renameStartAscendingFrom: "Start ascending from",
	renameStopDescendingAt: "Stop descending at",
	renameInvalidPattern: "Invalid regular expression",
	ok: "OK",
	copy: "Copy",
	copied: "Copied",
	copiedExclamation: "Copied!",
	copyMessage: "Copy message",
	createCollection: "Create collection",
	renameCollection: "Rename collection",
	deleteCollection: "Delete collection",
	localVariables: "Local variables",
	noVariableCollections: "No variable collections",
	modes: "Modes",
	addMode: "Add mode",
	renameMode: "Rename mode",
	duplicateMode: "Duplicate mode",
	deleteMode: "Delete mode",
	setDefaultMode: "Set as default",
	selectLayerForJSX: "Select a layer to see its JSX code",
	copyJSXReference: "Copy JSX prop reference to clipboard",
	newTab: "New tab",
	closeTab: params("Close {name}"),
	showUI: params("Show UI ({shortcut})"),
	fontSettings: "Font settings",
	fontSettingsDesktopDescription: "Access system fonts, online providers, fallback packs, and cached downloads.",
	fontSettingsBrowserDescription: "Allow browser access to local fonts and manage online font providers.",
	localFonts: "Local fonts",
	onlineFonts: "Online fonts",
	downloadedCache: "Downloaded cache",
	lastUpdated: "Last updated",
	enabled: "Enabled",
	disabled: "Disabled",
	denied: "Denied",
	unavailable: "Unavailable",
	notRequested: "Not requested",
	never: "Never",
	systemFontAccess: "System font access",
	systemFontsAvailable: "System fonts are available.",
	allowBrowserFontAccess: "Allow browser font access when system fonts are missing.",
	allow: "Allow",
	requesting: "Requesting…",
	onlineFontProviders: "Online font providers",
	downloadMissingWebFonts: "Download missing web fonts through enabled providers.",
	webFontProvidersRequireDesktopApp: "Online font provider catalogs are unavailable in the web app. Download the desktop app to browse and load provider fonts.",
	clipboardImageUnavailableWeb: "Pasted design includes 1 image that cannot be loaded in the web app. Use the desktop app to include it.",
	clipboardImagesUnavailableWeb: params("Pasted design includes {count} images that cannot be loaded in the web app. Use the desktop app to include them."),
	clipboardImageFetchFailed: "Failed to fetch 1 image from Figma. Check that the source file is accessible and try again.",
	clipboardImagesFetchFailed: params("Failed to fetch {count} images from Figma. Check that the source file is accessible and try again."),
	enable: "Enable",
	disable: "Disable",
	fallbackPacks: "Fallback packs",
	downloadFallbackPacksDescription: "Download CJK and Arabic fallbacks before opening files that need them.",
	download: "Download",
	downloading: "Downloading…",
	refresh: "Refresh",
	clearCache: "Clear cache",
	localFontAccessEnabled: "Local font access enabled.",
	localFontAccessNotGranted: "Local font access was not granted.",
	onlineFontProvidersEnabled: "Online font providers enabled.",
	onlineFontProvidersDisabled: "Online font providers disabled.",
	fontProviderEnabled: params("Enabled {provider}."),
	fontProviderDisabled: params("Disabled {provider}."),
	fallbackFontsDownloaded: "Fallback fonts downloaded.",
	fallbackFontsDownloadFailed: "Could not download fallback fonts.",
	downloadedFontCacheCleared: "Downloaded font cache cleared.",
	downloadedFontCacheClearFailed: "Could not clear downloaded font cache.",
	you: "You",
	youSuffix: "you",
	followingPeerStop: params("Following {name} (click to stop)"),
	clickToFollowPeer: params("Click to follow {name}"),
	connectAIProvider: "Connect an AI provider to start chatting.",
	connect: "Connect",
	testConnection: "Test connection",
	testingConnection: "Testing…",
	connectionTestSuccess: "Connected successfully. Model is reachable.",
	connectionTestMissingAPIKey: "Enter an API key before testing.",
	connectionTestMissingBaseURL: "Enter a base URL before testing.",
	connectionTestMissingModel: "Enter a model ID before testing.",
	connectionTestInvalidBaseURL: "Base URL is invalid. Use a full URL like https://api.example.com/v1.",
	connectionTestAuthFailed: "Authentication failed. Check your API key.",
	connectionTestModelNotFound: "Model not found. Check the model ID.",
	connectionTestAPITypeMismatch: "This endpoint does not appear to support the selected API type. Try Completions or Responses.",
	connectionTestBrowserNetworkFailed: "Could not reach this endpoint from the browser. Try the desktop app or use an endpoint with CORS enabled.",
	connectionTestNetworkFailed: "Could not reach the endpoint. Check the URL and your network connection.",
	connectionTestUnknownFailed: "Connection test failed. Check the provider settings and try again.",
	getAPIKey: params("Get an {provider} API key →"),
	oneKeyManyModels: "One key for 100+ models from all providers.",
	describeChange: "Describe a change…",
	describeCreateOrChange: "Describe what you want to create or change.",
	stopGenerating: "Stop generating",
	sendMessage: "Send message",
	baseURLPlaceholder: "Base URL (e.g. http://localhost:11434/v1)",
	modelIDPlaceholder: "Model ID (e.g. llama-3.3-70b)",
	aiProvider: "AI Provider",
	providerSettings: "Provider settings",
	openProviderSettings: "Open provider settings",
	settings: "Settings",
	settingsDescription: "Manage integrations and app preferences.",
	settingsAIAndAgents: "AI & agents",
	models: "Models",
	modelsDescription: "Configure reusable models and their provider connections.",
	addModel: "Add model",
	editModel: "Edit model",
	modelEditorDescription: "Provider, model, credentials, and capabilities.",
	modelName: "Name",
	modelConfiguration: "Model",
	connectionSettings: "Connection",
	modelCapabilities: "Capabilities",
	modelCapabilitiesDetected: "Detected from the selected model.",
	modelCapabilitiesManual: "Declare compatibility for this custom model.",
	modelCapabilityTools: "Tool calling",
	modelCapabilityVision: "Image input",
	modelCapabilityToolsShort: "Tools",
	modelCapabilityVisionShort: "Vision",
	selectDesignModel: "Select design model",
	modelNeedsCredential: "Needs key",
	modelAgentConnection: "Agent",
	saveModel: "Save model",
	deleteModel: "Delete model",
	deleteModelDescription: "Delete this model and remove its role assignments?",
	modelAssignments: "Assignments",
	modelAssignmentsDescription: "Choose which configured model handles each type of work.",
	modelRoleDesign: "Design agent",
	modelRoleReview: "Review",
	modelRoleFast: "Fast tasks",
	modelRoleVision: "Vision",
	modelRoleDesignDescription: "AI chat and canvas edits",
	modelRoleReviewDescription: "Explicit plan and design reviews",
	modelRoleFastDescription: "Low-cost background work",
	modelRoleVisionDescription: "Screenshots and image references",
	modelRoleUseDesign: "Same as Design",
	noModel: "None",
	back: "Back",
	settingsMedia: "Media",
	vectorization: "Image vectorization",
	vectorizationDescription: "Send image layers to Recraft or fal.ai and return editable vectors. Provider charges may apply.",
	vectorizeProvider: "Vectorization service",
	settingsStorage: "Cloud storage",
	storageWorkspace: "Storage workspace",
	openStorageWorkspace: "Open workspace",
	newStoredDocument: "New document",
	emptyStorageWorkspace: "No stored documents yet.",
	loadingDocuments: "Loading documents…",
	storageNotConfigured: "Configure storage before using this workspace.",
	copyStorageCors: "Copy CORS JSON",
	storageEndpoint: "Endpoint",
	storageBucket: "Bucket",
	storageRegion: "Region",
	storageAccessKeyID: "Access key ID",
	storageSecretAccessKey: "Secret access key",
	save: "Save",
	credentialStorage: params("Credentials: {backend}"),
	credentialBackendNative: "system credential store",
	credentialBackendBrowser: "encrypted browser storage",
	credentialBackendMemory: "this session only",
	rememberCredentials: "Remember credentials on this browser",
	done: "Done",
	apiKey: "API Key",
	apiType: "API Type",
	baseURL: "Base URL",
	modelID: "Model ID",
	customModelID: "Custom model ID",
	customModel: "Custom model…",
	advancedModelSettings: "Advanced settings",
	outputLimit: "Output limit",
	outputLimitAutomatic: "Automatic recommendation",
	supported: "Supported",
	unsupported: "Not supported",
	tokens: "tokens",
	maxOutputTokens: "Max output tokens",
	clear: "Clear",
	keySavedReplace: "Key saved — enter new to replace",
	getAPIKeyGeneric: "Get API key →",
	pexelsAPIKey: "Pexels API Key (stock photos)",
	unsplashAccessKey: "Unsplash Access Key",
	stockPhotoToolOptional: "Optional — for stock_photo tool",
	pexelsAlternativeOptional: "Optional — alternative to Pexels",
	getPexelsAPIKey: "Get free Pexels API key →",
	getUnsplashAccessKey: "Get free Unsplash access key →",
	completions: "Completions",
	responses: "Responses",
	yourName: "Your name",
	enterYourName: "Enter your name",
	shareThisFile: "Share this file",
	joinRoom: "Join room",
	join: "Join",
	roomLink: "Room link",
	joinCollaboration: "Join collaboration",
	orJoinRoom: "or join a room",
	pasteRoomLinkOrId: "Paste room link or ID",
	connected: "Connected",
	search: "Search…",
	noResults: "No results",
	share: "Share",
	appUpToDate: "OpenPencil is up to date",
	updateAvailableTitle: "Update OpenPencil",
	updateAvailable: params("OpenPencil {version} is available."),
	updateInstallPrompt: "Download and install it now? The app will restart after the update is installed.",
	downloadingUpdate: params("Downloading OpenPencil {version}"),
	updateInstalledTitle: "Update installed",
	updateInstalled: params("OpenPencil {version} was installed{size}. Restarting now."),
	updateUnavailable: "Updates are not available yet. Publish a signed release with latest.json first.",
	updateCheckFailed: params("Could not check for updates: {error}")
};
const dialogMessages = i18n("dialogs", dialogMessageDefaults);
//#endregion
//#region src/i18n/messages/menu.ts
const menuMessageDefaults = {
	file: "File",
	edit: "Edit",
	view: "View",
	object: "Object",
	arrange: "Arrange",
	text: "Text",
	new: "New",
	open: "Open…",
	openStorageWorkspace: "Open storage workspace…",
	save: "Save",
	saveAs: "Save as…",
	exportSelection: "Export selection…",
	autosave: "Auto-save to local file",
	closeTab: "Close tab",
	copy: "Copy",
	paste: "Paste",
	theme: "Theme",
	themeLight: "Light",
	themeDark: "Dark",
	themeAuto: "Auto",
	profiler: "Performance profiler",
	language: "Language",
	settings: "Settings…",
	rulers: "Rulers",
	multiplayerCursors: "Multiplayer cursors",
	checkUpdates: "Check for updates…",
	moveToPage: "Move to page",
	createInstance: "Create instance",
	hide: "Hide",
	show: "Show",
	lock: "Lock",
	unlock: "Unlock",
	cut: "Cut",
	front: "Front",
	back: "Back",
	toggleUI: "Toggle UI",
	bold: "Bold",
	italic: "Italic",
	underline: "Underline",
	strikethrough: "Strikethrough",
	pasteHere: "Paste here",
	pasteToReplace: "Paste to replace",
	renameSelection: "Rename selection…",
	copyPasteAs: "Copy/Paste as",
	copyAsText: "Copy as text",
	copyAsSVG: "Copy as SVG",
	copyAsPNG: "Copy as PNG",
	copyAsJSX: "Copy as JSX",
	copyNodeId: "Copy node ID",
	copyXPath: "Copy XPath",
	convertToVector: "Convert to vector",
	booleanOperations: "Boolean operations",
	arrangeAlignLeft: "Align left",
	arrangeAlignCenter: "Align center",
	arrangeAlignRight: "Align right",
	arrangeAlignTop: "Align top",
	arrangeAlignMiddle: "Align middle",
	arrangeAlignBottom: "Align bottom",
	zoomIn: "Zoom in",
	zoomOut: "Zoom out"
};
const menuMessages = i18n("menu", menuMessageDefaults);
//#endregion
//#region src/i18n/messages/pages.ts
const pageMessageDefaults = {
	newPage: "New page",
	rename: "Rename",
	delete: "Delete",
	pageName: params("Page {number}")
};
const pageMessages = i18n("pages", pageMessageDefaults);
//#endregion
//#region src/i18n/messages/panels.ts
const panelMessageDefaults = {
	untitled: "Untitled",
	nodeCopyString: " copy",
	layers: "Layers",
	pages: "Pages",
	design: "Design",
	code: "Code",
	ai: "AI",
	assets: "Assets",
	searchLocalComponents: "Search local components",
	assetView: "Asset view",
	gridView: "Grid view",
	listView: "List view",
	viewDetails: "View details",
	assetLibraryBadge: "Library",
	assetVariantSummary: params("{count} variants · {names}"),
	duplicateVariantValues: "Duplicate variant values",
	openDocumentation: "Open documentation",
	noLocalComponents: "No local components",
	componentSet: "Component set",
	component: "Component",
	insertInstance: "Insert instance",
	description: "Description",
	documentation: "Documentation",
	openDocs: "Open docs",
	properties: "Properties",
	xAxis: "X Axis",
	yAxis: "Y Axis",
	rotation: "Rotation",
	width: "Width",
	height: "Height",
	opacity: "Opacity",
	blendMode: "Blend mode",
	radius: "Radius",
	cornerSmoothing: "Corner smoothing",
	spread: "Spread",
	page: "Page",
	frame: "Frame",
	framePreset: "Frame preset",
	framePresetCustom: "Custom",
	framePresetCategoryPhone: "Phone",
	framePresetCategoryTablet: "Tablet",
	framePresetCategoryDesktop: "Desktop",
	framePresetCategoryPresentation: "Presentation",
	framePresetCategoryWatch: "Watch",
	framePresetCategoryPaper: "Paper",
	framePresetCategorySocialMedia: "Social media",
	framePresetCategoryFigmaCommunity: "Figma Community",
	framePresetCategoryArchive: "Archive",
	position: "Position",
	layout: "Layout",
	autoLayout: "Auto layout",
	alignment: "Alignment",
	appearance: "Appearance",
	fill: "Fill",
	stroke: "Stroke",
	effects: "Effects",
	mask: "Mask",
	export: "Export",
	typography: "Typography",
	fontFamily: "Font family",
	fontWeight: "Font weight",
	fontSize: "Font size",
	lineHeight: "Line height",
	letterSpacing: "Letter spacing",
	textAlignment: "Text alignment",
	verticalTextAlignment: "Vertical text alignment",
	textCase: "Text case",
	textCaseOriginal: "Original",
	textCaseUpper: "Uppercase",
	textCaseLower: "Lowercase",
	textCaseTitle: "Title case",
	truncation: "Truncation",
	truncationDisabled: "Disabled",
	truncationEnding: "Ending ellipsis",
	maxLines: "Maximum lines",
	openTypeFeatures: "Font features",
	standardLigatures: "Standard ligatures",
	contextualAlternates: "Contextual alternates",
	kerning: "Kerning",
	textFormatting: "Text formatting",
	pageBackground: "Page background",
	variables: "Variables",
	variants: "Variants",
	componentProperties: "Component properties",
	constraints: "Constraints",
	horizontalConstraint: "Horizontal constraint",
	verticalConstraint: "Vertical constraint",
	constraintLeft: "Left",
	constraintRight: "Right",
	constraintTop: "Top",
	constraintBottom: "Bottom",
	constraintCenter: "Center",
	constraintLeftAndRight: "Left and right",
	constraintTopAndBottom: "Top and bottom",
	constraintScale: "Scale",
	constraintHorizontalCenter: "Horizontal center",
	constraintVerticalCenter: "Vertical center",
	addFill: "Add fill",
	addStroke: "Add stroke",
	addEffect: "Add effect",
	addExport: "Add export",
	removeFill: "Remove fill",
	removeStroke: "Remove stroke",
	removeEffect: "Remove effect",
	removeExport: "Remove export",
	effectSettings: "Effect settings",
	expandEffectSettings: "Expand effect settings",
	collapseEffectSettings: "Collapse effect settings",
	toggleExportPreview: "Toggle export preview",
	dropShadow: "Drop shadow",
	innerShadow: "Inner shadow",
	layerBlur: "Layer blur",
	backgroundBlur: "Background blur",
	foregroundBlur: "Foreground blur",
	maskType: "Mask type",
	maskTypeAlpha: "Alpha",
	maskTypeVector: "Vector",
	maskTypeLuminance: "Luminance",
	blendModePassThrough: "Pass through",
	blendModeNormal: "Normal",
	blendModeDarken: "Darken",
	blendModeMultiply: "Multiply",
	blendModeColorBurn: "Color burn",
	blendModeLighten: "Lighten",
	blendModeScreen: "Screen",
	blendModeColorDodge: "Color dodge",
	blendModeOverlay: "Overlay",
	blendModeSoftLight: "Soft light",
	blendModeHardLight: "Hard light",
	blendModeDifference: "Difference",
	blendModeExclusion: "Exclusion",
	blendModeHue: "Hue",
	blendModeSaturation: "Saturation",
	blendModeColor: "Color",
	blendModeLuminosity: "Luminosity",
	strokeType: "Stroke type",
	strokeWeight: "Stroke weight",
	noSelection: "No selection",
	noLocalVariables: "No local variables",
	openVariables: "Open variables",
	addPage: "Add page",
	toggleVisibility: "Toggle visibility",
	independentCornerRadii: "Independent corner radii",
	detachVariable: "Detach variable",
	applyVariable: "Apply variable",
	noVariablesFound: "No variables found",
	addAutoLayout: "Add auto layout",
	removeAutoLayout: "Remove auto layout",
	alignLeft: "Align left",
	alignCenterHorizontally: "Align center horizontally",
	alignRight: "Align right",
	alignTop: "Align top",
	alignCenterVertically: "Align center vertically",
	alignBottom: "Align bottom",
	flipHorizontal: "Flip horizontal",
	flipVertical: "Flip vertical",
	rotate90: "Rotate 90°",
	mixedFillsHelp: "Click + to replace mixed fills",
	mixedStrokesHelp: "Click + to replace mixed strokes",
	mixedEffectsHelp: "Click + to replace mixed effects",
	strokeSides: "Stroke sides",
	strokeDash: "Dashed stroke",
	strokeCap: "Stroke cap",
	strokeCapButt: "Butt cap",
	strokeCapRound: "Round cap",
	strokeCapSquare: "Square cap",
	strokeJoin: "Stroke join",
	strokeJoinMiter: "Miter join",
	strokeJoinBevel: "Bevel join",
	strokeJoinRound: "Round join",
	strokeMiterLimit: "Miter limit",
	strokeAlignInside: "Inside",
	strokeAlignCenter: "Center",
	strokeAlignOutside: "Outside",
	exportScale: "Export scale",
	exportFormat: "Export format",
	exportPreview: "Preview",
	exportRenderingPreview: "Rendering preview…",
	create: "Create",
	add: "Add",
	createVariable: "Create variable",
	createColorVariable: params("Create color variable from {value}"),
	createNumberVariable: params("Create number variable from {value}"),
	variableName: "Variable name",
	mixed: "Mixed",
	none: "None",
	fillStyle: "Fill style",
	strokeStyle: "Stroke style",
	textStyle: "Text style",
	effectStyle: "Effect style",
	gridStyle: "Grid style",
	missingStyle: params("Missing style ({id})"),
	layersCount: params("{count} layers"),
	goToMainComponent: "Go to Main Component",
	detachInstance: "Detach Instance",
	gap: "Gap",
	solid: "Solid",
	linearGradient: "Linear",
	radialGradient: "Radial",
	image: "Image",
	stops: "Stops",
	addStop: "Add stop",
	alignCenter: "Align center",
	alignMiddle: "Align middle",
	clipContent: "Clip content",
	colorFormatRgb: "RGB",
	colorFormatHsl: "HSL",
	colorFormatHsb: "HSB",
	colorFormatOkhcl: "OkHCL",
	colorHintHsl: "H hue · S saturation · L lightness",
	colorHintHsb: "H hue · S saturation · B brightness",
	colorHintOkhcl: "H hue · C chroma · L lightness · A alpha",
	colorPreviewClipped: params("Clipped to {space} preview gamut"),
	rulers: "Rulers",
	multiplayerCursors: "Multiplayer cursors",
	direction: "Direction",
	flow: "Flow",
	freeform: "Freeform",
	dimensions: "Dimensions",
	layoutHorizontal: "Horizontal layout",
	layoutVertical: "Vertical layout",
	layoutGrid: "Grid layout",
	layoutWrap: "Wrap layout",
	gapAuto: "Auto gap",
	horizontalGap: "Horizontal gap",
	verticalGap: "Vertical gap",
	auto: "Auto",
	columns: "Columns",
	rows: "Rows",
	sizingFixed: "Fixed",
	sizingHug: "Hug",
	sizingFill: "Fill",
	sizingHugShort: "Hug",
	sizingFillShort: "Fill",
	addMinWidth: "Add min width",
	removeMinWidth: "Remove min width",
	addMaxWidth: "Add max width",
	removeMaxWidth: "Remove max width",
	addMinHeight: "Add min height",
	removeMinHeight: "Remove min height",
	addMaxHeight: "Add max height",
	removeMaxHeight: "Remove max height",
	minWidthShort: "Min W",
	maxWidthShort: "Max W",
	minHeightShort: "Min H",
	maxHeightShort: "Max H",
	setToCurrentWidth: "Set to current width",
	setToCurrentHeight: "Set to current height",
	sizingFillFr: "Fill (fr)",
	sizingFixedPx: "Fixed (px)",
	resizing: "Resizing",
	resizeAutoWidth: "Auto width",
	resizeAutoHeight: "Auto height",
	resizeFixed: "Fixed size",
	layoutGrids: "Layout guide",
	addLayoutGrid: "Add layout guide",
	removeLayoutGrid: "Remove layout guide",
	gridColumns: "Columns",
	gridRows: "Rows",
	gridGrid: "Grid",
	gridCount: "Count",
	gridGutter: "Gutter",
	gridMargin: "Margin",
	gridSectionSize: "Section size",
	searchFonts: "Search fonts..."
};
const panelMessages = i18n("panels", panelMessageDefaults);
//#endregion
//#region src/i18n/messages/tools.ts
const toolMessageDefaults = {
	move: "Move",
	frame: "Frame",
	section: "Section",
	rectangle: "Rectangle",
	ellipse: "Ellipse",
	line: "Line",
	polygon: "Polygon",
	star: "Star",
	pen: "Pen",
	text: "Text",
	hand: "Hand"
};
const toolMessages = i18n("tools", toolMessageDefaults);
//#endregion
//#region src/i18n/messages/variable-types.ts
const variableTypeMessageDefaults = {
	color: "Color",
	colorHint: "Paint values",
	number: "Number",
	numberHint: "Sizes, spacing, opacity",
	text: "Text",
	textHint: "Copy and labels",
	boolean: "Boolean",
	booleanHint: "True or false"
};
const variableTypeMessages = i18n("variableTypes", variableTypeMessageDefaults);
//#endregion
//#region src/i18n/messages.ts
const messageDefaults = {
	menu: menuMessageDefaults,
	commands: commandMessageDefaults,
	tools: toolMessageDefaults,
	panels: panelMessageDefaults,
	variableTypes: variableTypeMessageDefaults,
	pages: pageMessageDefaults,
	dialogs: dialogMessageDefaults
};
//#endregion
//#region src/i18n/useI18n.ts
/**
* Reactive i18n composable for OpenPencil Vue components.
*
* Returns reactive translation objects grouped by domain, plus locale
* controls. All values update automatically when the locale changes.
*
* @example
* ```vue
* <script setup>
* const { menu, commands, locale, setLocale } = useI18n()
* <\/script>
*
* <template>
*   <button>{{ menu.save }}</button>
*   <span>{{ commands.undo }}</span>
* </template>
* ```
*/
function useI18nNamespace(messages) {
	return useStore(messages);
}
function useMenuMessages() {
	return useI18nNamespace(menuMessages);
}
function useCommandMessages() {
	return useI18nNamespace(commandMessages);
}
function useToolMessages() {
	return useI18nNamespace(toolMessages);
}
function usePanelMessages() {
	return useI18nNamespace(panelMessages);
}
function useVariableTypeMessages() {
	return useI18nNamespace(variableTypeMessages);
}
function usePageMessages() {
	return useI18nNamespace(pageMessages);
}
function useDialogMessages() {
	return useI18nNamespace(dialogMessages);
}
function useI18n() {
	return {
		menu: useMenuMessages(),
		commands: useCommandMessages(),
		tools: useToolMessages(),
		panels: usePanelMessages(),
		variableTypes: useVariableTypeMessages(),
		pages: usePageMessages(),
		dialogs: useDialogMessages(),
		locale: useStore(locale),
		availableLocales: AVAILABLE_LOCALES,
		localeLabels: LOCALE_LABELS,
		setLocale
	};
}
//#endregion
//#region src/shared/input/duplicate-drag.ts
function duplicateAndDrag(cx, cy, sx, sy, editor) {
	const previousSelection = new Set(editor.state.selectedIds);
	const { panels } = useI18n();
	const newIds = [];
	const newOriginals = /* @__PURE__ */ new Map();
	for (const id of previousSelection) {
		const source = editor.graph.getNode(id);
		if (!source) continue;
		const parentId = source.parentId ?? editor.state.currentPageId;
		const clone = editor.graph.cloneTree(id, parentId, { name: source.name + panels.value.nodeCopyString || " copy" });
		if (!clone) continue;
		newIds.push(clone.id);
		newOriginals.set(clone.id, {
			x: source.x,
			y: source.y,
			parentId
		});
	}
	editor.select(newIds);
	editor.requestRender();
	return {
		originals: newOriginals,
		drag: {
			type: "move",
			startX: cx,
			startY: cy,
			currentX: cx,
			currentY: cy,
			startScreenX: sx,
			startScreenY: sy,
			dragStarted: true,
			originals: newOriginals,
			duplicated: true,
			duplicatedPreviousSelection: previousSelection
		}
	};
}
//#endregion
//#region src/shared/input/select/move.ts
function selectionIsLocked(editor) {
	return [...editor.state.selectedIds].every((id) => editor.graph.getNode(id)?.locked);
}
function autoLayoutMoveTarget(id, editor) {
	let current = editor.graph.getNode(id);
	let target = current;
	while (current?.parentId) {
		const parent = editor.graph.getNode(current.parentId);
		if (!parent) break;
		if (current.type === "INSTANCE" && parent.layoutMode !== "NONE" && current.layoutPositioning !== "ABSOLUTE") target = current;
		current = parent;
	}
	return target?.id ?? id;
}
function collectMoveOriginals(editor) {
	const originals = /* @__PURE__ */ new Map();
	for (const selectedId of editor.state.selectedIds) {
		const id = autoLayoutMoveTarget(selectedId, editor);
		const node = editor.graph.getNode(id);
		if (node) originals.set(id, {
			x: node.x,
			y: node.y,
			parentId: node.parentId ?? editor.state.currentPageId
		});
	}
	return originals;
}
function detectDragAutoLayoutParent(originals, editor) {
	if (originals.size !== 1) return void 0;
	const [id, original] = [...originals][0];
	const node = editor.graph.getNode(id);
	const parent = editor.graph.getNode(original.parentId);
	if (parent && parent.layoutMode !== "NONE" && node?.layoutPositioning !== "ABSOLUTE") return parent.id;
}
function createSelectionMoveDrag(cx, cy, sx, sy, editor, duplicate) {
	if (duplicate && editor.state.selectedIds.size > 0) return duplicateAndDrag(cx, cy, sx, sy, editor).drag;
	const originals = collectMoveOriginals(editor);
	return {
		type: "move",
		startX: cx,
		startY: cy,
		currentX: cx,
		currentY: cy,
		startScreenX: sx,
		startScreenY: sy,
		dragStarted: false,
		originals,
		autoLayoutParentId: detectDragAutoLayoutParent(originals, editor)
	};
}
//#endregion
//#region src/shared/input/select.ts
function handleSelectDown(e, cx, cy, sx, sy, editor, fns, tryStartRotation, handleTextEditClick, setDrag) {
	if (getNodeEditState(editor)) {
		handleNodeEditDown(e, cx, cy, editor, setDrag);
		return;
	}
	if (editor.state.editingTextId && handleTextEditClick(cx, cy, e.shiftKey)) return;
	if (editor.state.editingTextId) editor.commitTextEdit();
	if (tryStartRotation(cx, cy)) return;
	const resizeDrag = tryStartResize(cx, cy, editor);
	if (resizeDrag) {
		setDrag(resizeDrag);
		return;
	}
	const hit = resolveHit(cx, cy, editor, fns);
	if (!hit) {
		if (!editor.state.enteredContainerId) {
			editor.clearSelection();
			setDrag({
				type: "marquee",
				startX: cx,
				startY: cy
			});
		}
		return;
	}
	if (!editor.state.selectedIds.has(hit.id) && !e.shiftKey) editor.select([hit.id]);
	else if (e.shiftKey) editor.select([hit.id], true);
	if (selectionIsLocked(editor)) return;
	setDrag(createSelectionMoveDrag(cx, cy, sx, sy, editor, e.altKey));
}
//#endregion
//#region src/canvas/tool-input/use.ts
function handleToolMouseDown({ event, cx, cy, sx, sy, editor, hitFns, cursorOverride, setDrag, tryStartRotation, handleTextEditClick }) {
	const tool = editor.state.activeTool;
	if (event.button === 1 || tool === "HAND") {
		startPanDrag(event, setDrag, editor);
		return;
	}
	if (tool === "SELECT") {
		handleSelectDown(event, cx, cy, sx, sy, editor, hitFns, tryStartRotation, handleTextEditClick, setDrag);
		return;
	}
	if (tool === "PEN") {
		startPenInput(event, cx, cy, editor, setDrag, cursorOverride);
		return;
	}
	if (tool === "TEXT") {
		startTextDraw(cx, cy, editor, setDrag);
		return;
	}
	startShapeDraw(cx, cy, editor, setDrag);
}
//#endregion
export { AVAILABLE_LOCALES, LOCALE_DIR_NAMES, LOCALE_LABELS, TRANSLATED_LOCALES, applyResize, commandMessages, commitResizePreview, dialogMessages, handleDrawMove, handleDrawUp, handleToolMouseDown, i18n, locale, localeSetting, menuMessages, messageDefaults, pageMessages, panelMessages, setLocale, toolMessages, updateHoverCursor, useCommandMessages, useDialogMessages, useI18n, useI18nNamespace, useMenuMessages, usePageMessages, usePanelMessages, useToolMessages, useVariableTypeMessages, variableTypeMessages };

//# sourceMappingURL=use.js.map