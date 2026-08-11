//#region src/constants.ts
const IS_BROWSER = typeof window !== "undefined";
const IS_TAURI = IS_BROWSER && "__TAURI_INTERNALS__" in window;
const BLACK = {
	r: 0,
	g: 0,
	b: 0,
	a: 1
};
const TRANSPARENT = {
	r: 0,
	g: 0,
	b: 0,
	a: 0
};
const DEFAULT_SHADOW_COLOR = {
	r: 0,
	g: 0,
	b: 0,
	a: .25
};
const SELECTION_COLOR = {
	r: .23,
	g: .51,
	b: .96,
	a: 1
};
const COMPONENT_COLOR = {
	r: .592,
	g: .278,
	b: 1,
	a: 1
};
const SNAP_COLOR = {
	r: 1,
	g: 0,
	b: .56,
	a: 1
};
const CANVAS_BG_COLOR = {
	r: .96,
	g: .96,
	b: .96,
	a: 1
};
const CANVAS_BG_COLOR_DARK = {
	r: .173,
	g: .173,
	b: .173,
	a: 1
};
/**
* Returns the canvas background to initialize new pages with. Defers
* to the OS `prefers-color-scheme` so users on a dark desktop don't
* get a white flash every time they open a document.
*
* NOTE: this is deliberately the runtime/new-page path only. The
* `.fig` serialization path continues to write the static light
* `CANVAS_BG_COLOR` so files stay portable — a dark-theme user saving
* a file must not force darkness on recipients.
*/
function getDefaultCanvasBgColor() {
	if (IS_BROWSER) {
		const params = new URLSearchParams(window.location.search);
		if ("env" in import.meta && import.meta.env.DEV && params.has("test")) return CANVAS_BG_COLOR;
	}
	if (IS_BROWSER && typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches) return CANVAS_BG_COLOR_DARK;
	return CANVAS_BG_COLOR;
}
const SNAP_THRESHOLD = 5;
const RULER_SIZE = 20;
const RULER_BG_COLOR = {
	r: .14,
	g: .14,
	b: .14,
	a: 1
};
const RULER_TICK_COLOR = {
	r: .4,
	g: .4,
	b: .4,
	a: 1
};
const RULER_TEXT_COLOR = {
	r: .55,
	g: .55,
	b: .55,
	a: 1
};
const RULER_BADGE_HEIGHT = 14;
const RULER_BADGE_PADDING = 3;
const RULER_BADGE_RADIUS = 2;
const RULER_BADGE_EXCLUSION = 30;
const RULER_TEXT_BASELINE = .65;
const RULER_MAJOR_TICK = .5;
const RULER_MINOR_TICK = .25;
const RULER_HIGHLIGHT_ALPHA = .3;
const PEN_HANDLE_RADIUS = 2.5;
const PEN_VERTEX_RADIUS = 3;
const PEN_CLOSE_RADIUS_BOOST = 2;
const PEN_PATH_STROKE_WIDTH = 2;
const PARENT_OUTLINE_ALPHA = .5;
const PARENT_OUTLINE_DASH = 4;
const DEFAULT_FONT_FAMILY = "Inter";
const DEFAULT_FONT_SIZE = 14;
const DEFAULT_STROKE_MITER_LIMIT = 4;
const LABEL_FONT_SIZE = 11;
const SIZE_FONT_SIZE = 10;
const HANDLE_HALF_SIZE = 3;
const LABEL_OFFSET_Y = 8;
const SIZE_PILL_PADDING_X = 6;
const SIZE_PILL_PADDING_Y = 6;
const SIZE_PILL_HEIGHT = 18;
const SIZE_PILL_RADIUS = 4;
const SIZE_PILL_TEXT_OFFSET_Y = 13;
const MARQUEE_FILL_ALPHA = .08;
const SELECTION_DASH_ALPHA = .6;
const DROP_HIGHLIGHT_ALPHA = .8;
const DROP_HIGHLIGHT_STROKE = 2;
const LAYOUT_INDICATOR_STROKE = 2;
const AUTO_LAYOUT_HOVER_TICK_LENGTH = 12;
const AUTO_LAYOUT_HOVER_STRIPE_GAP = 8;
const AUTO_LAYOUT_HOVER_STRIPE_WIDTH = 1;
const AUTO_LAYOUT_HOVER_STROKE_WIDTH = 1.5;
const AUTO_LAYOUT_HOVER_CHILD_DASH = 4;
const AUTO_LAYOUT_HOVER_VALUE_OFFSET = 18;
const AUTO_LAYOUT_HOVER_VALUE_PILL_HEIGHT = 22;
const AUTO_LAYOUT_HOVER_VALUE_PILL_RADIUS = 5;
const AUTO_LAYOUT_HOVER_VALUE_PILL_PADDING_X = 5;
const AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE = 12;
const AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE = 8;
const AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE = 20;
const AUTO_LAYOUT_PADDING_EDITOR_OFFSET_X = 18;
const AUTO_LAYOUT_PADDING_EDITOR_OFFSET_Y = 36;
const AUTO_LAYOUT_HOVER_BLUE = {
	r: .28,
	g: .64,
	b: 1,
	a: .82
};
const AUTO_LAYOUT_HOVER_BLUE_FILL = {
	r: .28,
	g: .64,
	b: 1,
	a: .1
};
const AUTO_LAYOUT_HOVER_MAGENTA = {
	r: 1,
	g: .32,
	b: .68,
	a: .78
};
const AUTO_LAYOUT_HOVER_MAGENTA_FILL = {
	r: 1,
	g: .32,
	b: .68,
	a: .1
};
const SECTION_CORNER_RADIUS = 5;
const SECTION_TITLE_HEIGHT = 24;
const SECTION_TITLE_PADDING_X = 8;
const SECTION_TITLE_RADIUS = 5;
const SECTION_TITLE_FONT_SIZE = 12;
const SECTION_TITLE_GAP = 6;
const COMPONENT_SET_DASH = 6;
const COMPONENT_SET_DASH_GAP = 4;
const COMPONENT_SET_BORDER_WIDTH = 1.5;
const COMPONENT_LABEL_FONT_SIZE = 11;
const COMPONENT_LABEL_GAP = 6;
const COMPONENT_LABEL_ICON_SIZE = 10;
const COMPONENT_LABEL_ICON_GAP = 4;
const RULER_TARGET_PIXEL_SPACING = 100;
const RULER_MAJOR_TOLERANCE = .01;
const FLASH_COLOR = SELECTION_COLOR;
const FLASH_ATTACK_MS = 200;
const FLASH_HOLD_MS = 400;
const FLASH_RELEASE_MS = 300;
const FLASH_STROKE_WIDTH = 2;
const FLASH_PADDING = 5;
const FLASH_OVERSHOOT = 30;
const FLASH_RADIUS = 4;
const AI_ACTIVE_COLOR = {
	r: .26,
	g: .52,
	b: .96
};
const AI_DONE_COLOR = {
	r: .16,
	g: .73,
	b: .36
};
const AI_PULSE_PERIOD_MS = 1500;
const AI_DONE_DURATION_MS = 800;
const TEXT_SELECTION_COLOR = {
	r: .26,
	g: .52,
	b: .96,
	a: .3
};
const TEXT_CARET_COLOR = BLACK;
const TEXT_CARET_WIDTH = 1;
const ACP_AGENTS = [
	{
		id: "claude-code",
		name: "Claude Code",
		command: "claude-agent-acp",
		args: [],
		installCommand: "npm i -g @agentclientprotocol/claude-agent-acp"
	},
	{
		id: "codex",
		name: "Codex",
		command: "codex-acp",
		args: [],
		installCommand: "npm i -g @zed-industries/codex-acp"
	},
	{
		id: "gemini-cli",
		name: "Gemini CLI",
		command: "gemini",
		args: ["--acp"],
		installCommand: "npm i -g @google/gemini-cli"
	}
];
const AI_PROVIDERS = [
	{
		id: "openrouter",
		name: "OpenRouter",
		keyPlaceholder: "sk-or-…",
		keyURL: "https://openrouter.ai/keys",
		defaultModel: "anthropic/claude-sonnet-4.6",
		supportsCustomModel: true,
		models: [
			{
				id: "anthropic/claude-sonnet-4.6",
				name: "Claude Sonnet 4.6",
				tag: "Best for design"
			},
			{
				id: "anthropic/claude-opus-4.6",
				name: "Claude Opus 4.6",
				tag: "Smartest"
			},
			{
				id: "moonshotai/kimi-k2.5",
				name: "Kimi K2.5",
				tag: "Vision + code"
			},
			{
				id: "google/gemini-3.1-pro-preview",
				name: "Gemini 3.1 Pro",
				tag: "1M context"
			},
			{
				id: "openai/gpt-5.3-codex",
				name: "GPT-5.3 Codex"
			},
			{
				id: "google/gemini-3-flash-preview",
				name: "Gemini 3 Flash",
				tag: "Fast"
			},
			{
				id: "deepseek/deepseek-v3.2",
				name: "DeepSeek V3.2",
				tag: "Cheap"
			},
			{
				id: "qwen/qwen3.5-flash-02-23",
				name: "Qwen 3.5 Flash",
				tag: "Cheap"
			},
			{
				id: "qwen/qwen3-coder:free",
				name: "Qwen3 Coder",
				tag: "Free"
			},
			{
				id: "openai/gpt-oss-120b:free",
				name: "GPT-OSS 120B",
				tag: "Free"
			}
		]
	},
	{
		id: "anthropic",
		name: "Anthropic",
		keyPlaceholder: "sk-ant-…",
		keyURL: "https://console.anthropic.com/settings/keys",
		defaultModel: "claude-sonnet-4-6-20260301",
		models: [{
			id: "claude-sonnet-4-6-20260301",
			name: "Claude Sonnet 4.6",
			tag: "Best for design"
		}, {
			id: "claude-opus-4-6-20260301",
			name: "Claude Opus 4.6",
			tag: "Smartest"
		}]
	},
	{
		id: "openai",
		name: "OpenAI",
		keyPlaceholder: "sk-…",
		keyURL: "https://platform.openai.com/api-keys",
		defaultModel: "gpt-5.3-codex",
		models: [
			{
				id: "gpt-5.3-codex",
				name: "GPT-5.3 Codex"
			},
			{
				id: "gpt-4.1",
				name: "GPT-4.1"
			},
			{
				id: "o3",
				name: "o3",
				tag: "Reasoning"
			},
			{
				id: "o4-mini",
				name: "o4-mini",
				tag: "Fast reasoning"
			}
		]
	},
	{
		id: "google",
		name: "Google AI",
		keyPlaceholder: "AIza…",
		keyURL: "https://aistudio.google.com/apikey",
		defaultModel: "gemini-3.1-pro-preview",
		models: [{
			id: "gemini-3.1-pro-preview",
			name: "Gemini 3.1 Pro",
			tag: "1M context"
		}, {
			id: "gemini-3-flash-preview",
			name: "Gemini 3 Flash",
			tag: "Fast"
		}]
	},
	{
		id: "deepseek",
		name: "DeepSeek",
		keyPlaceholder: "sk-…",
		keyURL: "https://platform.deepseek.com/api_keys",
		defaultModel: "deepseek-v4-flash",
		models: [{
			id: "deepseek-v4-flash",
			name: "DeepSeek V4 Flash",
			tag: "Fast"
		}, {
			id: "deepseek-v4-pro",
			name: "DeepSeek V4 Pro",
			tag: "Reasoning"
		}]
	},
	{
		id: "zai",
		name: "Z.ai",
		keyPlaceholder: "API key",
		keyURL: "https://docs.z.ai/devpack/quick-start",
		defaultModel: "glm-5.1",
		models: [
			{
				id: "glm-5.1",
				name: "GLM-5.1",
				tag: "Best"
			},
			{
				id: "glm-5",
				name: "GLM-5"
			},
			{
				id: "glm-5-code",
				name: "GLM-5-Code"
			},
			{
				id: "glm-4.7",
				name: "GLM-4.7"
			},
			{
				id: "glm-4.7-flashx",
				name: "GLM-4.7-FlashX"
			},
			{
				id: "glm-4.6",
				name: "GLM-4.6"
			},
			{
				id: "glm-4.5",
				name: "GLM-4.5"
			},
			{
				id: "glm-4.5-x",
				name: "GLM-4.5-X"
			},
			{
				id: "glm-4.5-air",
				name: "GLM-4.5-Air"
			},
			{
				id: "glm-4.5-airx",
				name: "GLM-4.5-AirX"
			},
			{
				id: "glm-4-32b-0414-128k",
				name: "GLM-4-32B-0414-128K"
			},
			{
				id: "glm-4.7-flash",
				name: "GLM-4.7-Flash",
				tag: "Free"
			},
			{
				id: "glm-4.5-flash",
				name: "GLM-4.5-Flash",
				tag: "Free"
			}
		]
	},
	{
		id: "minimax",
		name: "MiniMax",
		keyPlaceholder: "API key",
		keyURL: "https://platform.minimax.io/user-center/basic-information/interface-key",
		defaultModel: "MiniMax-M3",
		models: [
			{
				id: "MiniMax-M3",
				name: "MiniMax-M3",
				tag: "Best"
			},
			{
				id: "MiniMax-M2.7",
				name: "MiniMax-M2.7"
			},
			{
				id: "MiniMax-M2.7-highspeed",
				name: "MiniMax-M2.7-highspeed",
				tag: "Fast"
			},
			{
				id: "MiniMax-M2.5",
				name: "MiniMax-M2.5"
			},
			{
				id: "MiniMax-M2.5-highspeed",
				name: "MiniMax-M2.5 Highspeed",
				tag: "Fast"
			},
			{
				id: "MiniMax-M2.1",
				name: "MiniMax-M2.1"
			},
			{
				id: "MiniMax-M2.1-highspeed",
				name: "MiniMax-M2.1 Highspeed",
				tag: "Fast"
			},
			{
				id: "MiniMax-M2",
				name: "MiniMax-M2"
			}
		]
	},
	{
		id: "openai-compatible",
		name: "OpenAI-compatible",
		keyPlaceholder: "API key",
		keyURL: "",
		defaultModel: "",
		models: [],
		supportsCustomBaseURL: true,
		supportsCustomModel: true
	},
	{
		id: "anthropic-compatible",
		name: "Anthropic-compatible",
		keyPlaceholder: "API key",
		keyURL: "",
		defaultModel: "",
		models: [],
		supportsCustomBaseURL: true,
		supportsCustomModel: true
	}
];
const DEFAULT_AI_PROVIDER = "openai-compatible";
const DEFAULT_AI_MODEL = AI_PROVIDERS.find((provider) => provider.id === "openai-compatible")?.defaultModel ?? "";
const AUTOMATION_HTTP_PORT = 7600;
const GOOGLE_FONTS_API_KEY = "AIzaSyD1tYDR_dUEiV-Tw1vksEhZbUytgKW5pc8";
const CJK_FALLBACK_FAMILIES_MACOS = [
	"PingFang SC",
	"PingFang TC",
	"Hiragino Sans",
	"Apple SD Gothic Neo",
	"Heiti SC",
	"Heiti TC"
];
const CJK_FALLBACK_FAMILIES_WINDOWS = [
	"Microsoft YaHei",
	"Microsoft YaHei UI",
	"Microsoft JhengHei",
	"Yu Gothic",
	"Malgun Gothic",
	"SimHei",
	"SimSun"
];
const CJK_FALLBACK_FAMILIES_LINUX = [
	"Noto Sans CJK SC",
	"Noto Sans CJK TC",
	"Noto Sans CJK JP",
	"Noto Sans CJK KR",
	"WenQuanYi Micro Hei",
	"Droid Sans Fallback"
];
const CJK_GOOGLE_FONTS = [
	"Noto Sans SC",
	"Noto Sans TC",
	"Noto Sans JP",
	"Noto Sans KR"
];
const DEFAULT_SHAPE_FILL = {
	type: "SOLID",
	color: {
		r: .83,
		g: .83,
		b: .83,
		a: 1
	},
	opacity: 1,
	visible: true
};
const DEFAULT_FRAME_FILL = {
	type: "SOLID",
	color: {
		r: 1,
		g: 1,
		b: 1,
		a: 1
	},
	opacity: 1,
	visible: true
};
const SECTION_DEFAULT_FILL = {
	type: "SOLID",
	color: {
		r: .37,
		g: .37,
		b: .37,
		a: 1
	},
	opacity: 1,
	visible: true
};
const SECTION_DEFAULT_STROKE = {
	color: {
		r: .55,
		g: .55,
		b: .55,
		a: 1
	},
	weight: 1,
	opacity: 1,
	visible: true,
	align: "INSIDE"
};
const ZOOM_DIVISOR = 50;
const ZOOM_SCALE_MIN = .75;
const ZOOM_SCALE_MAX = 1.25;
const PEN_CLOSE_THRESHOLD = 8;
const ROTATION_SNAP_DEGREES = 15;
const CORNER_ROTATE_ZONE = 16;
const HANDLE_HIT_RADIUS = 6;
const DEFAULT_TEXT_WIDTH = 200;
const DEFAULT_TEXT_HEIGHT = 24;
const AUTO_LAYOUT_BREAK_THRESHOLD = 8;
//#endregion
export { ACP_AGENTS, AI_ACTIVE_COLOR, AI_DONE_COLOR, AI_DONE_DURATION_MS, AI_PROVIDERS, AI_PULSE_PERIOD_MS, AUTOMATION_HTTP_PORT, AUTO_LAYOUT_BREAK_THRESHOLD, AUTO_LAYOUT_HOVER_BLUE, AUTO_LAYOUT_HOVER_BLUE_FILL, AUTO_LAYOUT_HOVER_CHILD_DASH, AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_MAGENTA, AUTO_LAYOUT_HOVER_MAGENTA_FILL, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_STRIPE_GAP, AUTO_LAYOUT_HOVER_STRIPE_WIDTH, AUTO_LAYOUT_HOVER_STROKE_WIDTH, AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE, AUTO_LAYOUT_HOVER_TICK_LENGTH, AUTO_LAYOUT_HOVER_VALUE_OFFSET, AUTO_LAYOUT_HOVER_VALUE_PILL_HEIGHT, AUTO_LAYOUT_HOVER_VALUE_PILL_PADDING_X, AUTO_LAYOUT_HOVER_VALUE_PILL_RADIUS, AUTO_LAYOUT_PADDING_EDITOR_OFFSET_X, AUTO_LAYOUT_PADDING_EDITOR_OFFSET_Y, BLACK, CANVAS_BG_COLOR, CANVAS_BG_COLOR_DARK, CJK_FALLBACK_FAMILIES_LINUX, CJK_FALLBACK_FAMILIES_MACOS, CJK_FALLBACK_FAMILIES_WINDOWS, CJK_GOOGLE_FONTS, COMPONENT_COLOR, COMPONENT_LABEL_FONT_SIZE, COMPONENT_LABEL_GAP, COMPONENT_LABEL_ICON_GAP, COMPONENT_LABEL_ICON_SIZE, COMPONENT_SET_BORDER_WIDTH, COMPONENT_SET_DASH, COMPONENT_SET_DASH_GAP, CORNER_ROTATE_ZONE, DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_FRAME_FILL, DEFAULT_SHADOW_COLOR, DEFAULT_SHAPE_FILL, DEFAULT_STROKE_MITER_LIMIT, DEFAULT_TEXT_HEIGHT, DEFAULT_TEXT_WIDTH, DROP_HIGHLIGHT_ALPHA, DROP_HIGHLIGHT_STROKE, FLASH_ATTACK_MS, FLASH_COLOR, FLASH_HOLD_MS, FLASH_OVERSHOOT, FLASH_PADDING, FLASH_RADIUS, FLASH_RELEASE_MS, FLASH_STROKE_WIDTH, GOOGLE_FONTS_API_KEY, HANDLE_HALF_SIZE, HANDLE_HIT_RADIUS, IS_BROWSER, IS_TAURI, LABEL_FONT_SIZE, LABEL_OFFSET_Y, LAYOUT_INDICATOR_STROKE, MARQUEE_FILL_ALPHA, PARENT_OUTLINE_ALPHA, PARENT_OUTLINE_DASH, PEN_CLOSE_RADIUS_BOOST, PEN_CLOSE_THRESHOLD, PEN_HANDLE_RADIUS, PEN_PATH_STROKE_WIDTH, PEN_VERTEX_RADIUS, ROTATION_SNAP_DEGREES, RULER_BADGE_EXCLUSION, RULER_BADGE_HEIGHT, RULER_BADGE_PADDING, RULER_BADGE_RADIUS, RULER_BG_COLOR, RULER_HIGHLIGHT_ALPHA, RULER_MAJOR_TICK, RULER_MAJOR_TOLERANCE, RULER_MINOR_TICK, RULER_SIZE, RULER_TARGET_PIXEL_SPACING, RULER_TEXT_BASELINE, RULER_TEXT_COLOR, RULER_TICK_COLOR, SECTION_CORNER_RADIUS, SECTION_DEFAULT_FILL, SECTION_DEFAULT_STROKE, SECTION_TITLE_FONT_SIZE, SECTION_TITLE_GAP, SECTION_TITLE_HEIGHT, SECTION_TITLE_PADDING_X, SECTION_TITLE_RADIUS, SELECTION_COLOR, SELECTION_DASH_ALPHA, SIZE_FONT_SIZE, SIZE_PILL_HEIGHT, SIZE_PILL_PADDING_X, SIZE_PILL_PADDING_Y, SIZE_PILL_RADIUS, SIZE_PILL_TEXT_OFFSET_Y, SNAP_COLOR, SNAP_THRESHOLD, TEXT_CARET_COLOR, TEXT_CARET_WIDTH, TEXT_SELECTION_COLOR, TRANSPARENT, ZOOM_DIVISOR, ZOOM_SCALE_MAX, ZOOM_SCALE_MIN, getDefaultCanvasBgColor };

//# sourceMappingURL=constants.js.map