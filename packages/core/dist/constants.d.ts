import { Fill, Stroke } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/constants.d.ts
declare const IS_BROWSER: boolean;
declare const IS_TAURI: boolean;
declare const BLACK: Color$1;
declare const TRANSPARENT: Color$1;
declare const DEFAULT_SHADOW_COLOR: Color$1;
declare const SELECTION_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const COMPONENT_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const SNAP_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const CANVAS_BG_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const CANVAS_BG_COLOR_DARK: {
  r: number;
  g: number;
  b: number;
  a: number;
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
declare function getDefaultCanvasBgColor(): Color$1;
declare const SNAP_THRESHOLD = 5;
declare const RULER_SIZE = 20;
declare const RULER_BG_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const RULER_TICK_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const RULER_TEXT_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const RULER_BADGE_HEIGHT = 14;
declare const RULER_BADGE_PADDING = 3;
declare const RULER_BADGE_RADIUS = 2;
declare const RULER_BADGE_EXCLUSION = 30;
declare const RULER_TEXT_BASELINE = 0.65;
declare const RULER_MAJOR_TICK = 0.5;
declare const RULER_MINOR_TICK = 0.25;
declare const RULER_HIGHLIGHT_ALPHA = 0.3;
declare const PEN_HANDLE_RADIUS = 2.5;
declare const PEN_VERTEX_RADIUS = 3;
declare const PEN_CLOSE_RADIUS_BOOST = 2;
declare const PEN_PATH_STROKE_WIDTH = 2;
declare const PARENT_OUTLINE_ALPHA = 0.5;
declare const PARENT_OUTLINE_DASH = 4;
declare const DEFAULT_FONT_FAMILY = "Inter";
declare const DEFAULT_FONT_SIZE = 14;
declare const DEFAULT_STROKE_MITER_LIMIT = 4;
declare const LABEL_FONT_SIZE = 11;
declare const SIZE_FONT_SIZE = 10;
declare const HANDLE_HALF_SIZE = 3;
declare const LABEL_OFFSET_Y = 8;
declare const SIZE_PILL_PADDING_X = 6;
declare const SIZE_PILL_PADDING_Y = 6;
declare const SIZE_PILL_HEIGHT = 18;
declare const SIZE_PILL_RADIUS = 4;
declare const SIZE_PILL_TEXT_OFFSET_Y = 13;
declare const MARQUEE_FILL_ALPHA = 0.08;
declare const SELECTION_DASH_ALPHA = 0.6;
declare const DROP_HIGHLIGHT_ALPHA = 0.8;
declare const DROP_HIGHLIGHT_STROKE = 2;
declare const LAYOUT_INDICATOR_STROKE = 2;
declare const AUTO_LAYOUT_HOVER_TICK_LENGTH = 12;
declare const AUTO_LAYOUT_HOVER_STRIPE_GAP = 8;
declare const AUTO_LAYOUT_HOVER_STRIPE_WIDTH = 1;
declare const AUTO_LAYOUT_HOVER_STROKE_WIDTH = 1.5;
declare const AUTO_LAYOUT_HOVER_CHILD_DASH = 4;
declare const AUTO_LAYOUT_HOVER_VALUE_OFFSET = 18;
declare const AUTO_LAYOUT_HOVER_VALUE_PILL_HEIGHT = 22;
declare const AUTO_LAYOUT_HOVER_VALUE_PILL_RADIUS = 5;
declare const AUTO_LAYOUT_HOVER_VALUE_PILL_PADDING_X = 5;
declare const AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE = 12;
declare const AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE = 8;
declare const AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE = 20;
declare const AUTO_LAYOUT_PADDING_EDITOR_OFFSET_X = 18;
declare const AUTO_LAYOUT_PADDING_EDITOR_OFFSET_Y = 36;
declare const AUTO_LAYOUT_HOVER_BLUE: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const AUTO_LAYOUT_HOVER_BLUE_FILL: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const AUTO_LAYOUT_HOVER_MAGENTA: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const AUTO_LAYOUT_HOVER_MAGENTA_FILL: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const SECTION_CORNER_RADIUS = 5;
declare const SECTION_TITLE_HEIGHT = 24;
declare const SECTION_TITLE_PADDING_X = 8;
declare const SECTION_TITLE_RADIUS = 5;
declare const SECTION_TITLE_FONT_SIZE = 12;
declare const SECTION_TITLE_GAP = 6;
declare const COMPONENT_SET_DASH = 6;
declare const COMPONENT_SET_DASH_GAP = 4;
declare const COMPONENT_SET_BORDER_WIDTH = 1.5;
declare const COMPONENT_LABEL_FONT_SIZE = 11;
declare const COMPONENT_LABEL_GAP = 6;
declare const COMPONENT_LABEL_ICON_SIZE = 10;
declare const COMPONENT_LABEL_ICON_GAP = 4;
declare const RULER_TARGET_PIXEL_SPACING = 100;
declare const RULER_MAJOR_TOLERANCE = 0.01;
declare const FLASH_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const FLASH_ATTACK_MS = 200;
declare const FLASH_HOLD_MS = 400;
declare const FLASH_RELEASE_MS = 300;
declare const FLASH_STROKE_WIDTH = 2;
declare const FLASH_PADDING = 5;
declare const FLASH_OVERSHOOT = 30;
declare const FLASH_RADIUS = 4;
declare const AI_ACTIVE_COLOR: {
  r: number;
  g: number;
  b: number;
};
declare const AI_DONE_COLOR: {
  r: number;
  g: number;
  b: number;
};
declare const AI_PULSE_PERIOD_MS = 1500;
declare const AI_DONE_DURATION_MS = 800;
declare const TEXT_SELECTION_COLOR: {
  r: number;
  g: number;
  b: number;
  a: number;
};
declare const TEXT_CARET_COLOR: Color$1;
declare const TEXT_CARET_WIDTH = 1;
type ACPAgentID = 'claude-code' | 'codex' | 'gemini-cli';
interface ACPAgentDef {
  id: ACPAgentID;
  name: string;
  command: string;
  args: string[];
  installCommand?: string;
}
declare const ACP_AGENTS: ACPAgentDef[];
type AIProviderID = 'openrouter' | 'anthropic' | 'openai' | 'google' | 'deepseek' | 'openai-compatible' | 'zai' | 'minimax' | 'anthropic-compatible' | `acp:${ACPAgentID}`;
interface ModelOption {
  id: string;
  name: string;
  tag?: string;
  capabilities?: readonly ('tools' | 'vision')[];
  recommendedMaxOutputTokens?: number;
}
interface AIProviderDef {
  id: AIProviderID;
  name: string;
  keyPlaceholder: string;
  keyURL: string;
  models: ModelOption[];
  defaultModel: string;
  supportsCustomBaseURL?: boolean;
  supportsCustomModel?: boolean;
}
declare const AI_PROVIDERS: AIProviderDef[];
declare const DEFAULT_AI_PROVIDER: AIProviderID;
declare const DEFAULT_AI_MODEL: string;
declare const AUTOMATION_HTTP_PORT = 7600;
declare const GOOGLE_FONTS_API_KEY = "AIzaSyD1tYDR_dUEiV-Tw1vksEhZbUytgKW5pc8";
declare const CJK_FALLBACK_FAMILIES_MACOS: string[];
declare const CJK_FALLBACK_FAMILIES_WINDOWS: string[];
declare const CJK_FALLBACK_FAMILIES_LINUX: string[];
declare const CJK_GOOGLE_FONTS: string[];
declare const DEFAULT_SHAPE_FILL: Fill;
declare const DEFAULT_FRAME_FILL: Fill;
declare const SECTION_DEFAULT_FILL: Fill;
declare const SECTION_DEFAULT_STROKE: Stroke;
declare const ZOOM_DIVISOR = 50;
declare const ZOOM_SCALE_MIN = 0.75;
declare const ZOOM_SCALE_MAX = 1.25;
declare const PEN_CLOSE_THRESHOLD = 8;
declare const ROTATION_SNAP_DEGREES = 15;
declare const CORNER_ROTATE_ZONE = 16;
declare const HANDLE_HIT_RADIUS = 6;
declare const DEFAULT_TEXT_WIDTH = 200;
declare const DEFAULT_TEXT_HEIGHT = 24;
declare const AUTO_LAYOUT_BREAK_THRESHOLD = 8;
//#endregion
export { ACPAgentDef, ACPAgentID, ACP_AGENTS, AIProviderDef, AIProviderID, AI_ACTIVE_COLOR, AI_DONE_COLOR, AI_DONE_DURATION_MS, AI_PROVIDERS, AI_PULSE_PERIOD_MS, AUTOMATION_HTTP_PORT, AUTO_LAYOUT_BREAK_THRESHOLD, AUTO_LAYOUT_HOVER_BLUE, AUTO_LAYOUT_HOVER_BLUE_FILL, AUTO_LAYOUT_HOVER_CHILD_DASH, AUTO_LAYOUT_HOVER_GAP_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_MAGENTA, AUTO_LAYOUT_HOVER_MAGENTA_FILL, AUTO_LAYOUT_HOVER_PADDING_REGION_TOLERANCE, AUTO_LAYOUT_HOVER_STRIPE_GAP, AUTO_LAYOUT_HOVER_STRIPE_WIDTH, AUTO_LAYOUT_HOVER_STROKE_WIDTH, AUTO_LAYOUT_HOVER_TICK_HIT_TOLERANCE, AUTO_LAYOUT_HOVER_TICK_LENGTH, AUTO_LAYOUT_HOVER_VALUE_OFFSET, AUTO_LAYOUT_HOVER_VALUE_PILL_HEIGHT, AUTO_LAYOUT_HOVER_VALUE_PILL_PADDING_X, AUTO_LAYOUT_HOVER_VALUE_PILL_RADIUS, AUTO_LAYOUT_PADDING_EDITOR_OFFSET_X, AUTO_LAYOUT_PADDING_EDITOR_OFFSET_Y, BLACK, CANVAS_BG_COLOR, CANVAS_BG_COLOR_DARK, CJK_FALLBACK_FAMILIES_LINUX, CJK_FALLBACK_FAMILIES_MACOS, CJK_FALLBACK_FAMILIES_WINDOWS, CJK_GOOGLE_FONTS, COMPONENT_COLOR, COMPONENT_LABEL_FONT_SIZE, COMPONENT_LABEL_GAP, COMPONENT_LABEL_ICON_GAP, COMPONENT_LABEL_ICON_SIZE, COMPONENT_SET_BORDER_WIDTH, COMPONENT_SET_DASH, COMPONENT_SET_DASH_GAP, CORNER_ROTATE_ZONE, DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_FRAME_FILL, DEFAULT_SHADOW_COLOR, DEFAULT_SHAPE_FILL, DEFAULT_STROKE_MITER_LIMIT, DEFAULT_TEXT_HEIGHT, DEFAULT_TEXT_WIDTH, DROP_HIGHLIGHT_ALPHA, DROP_HIGHLIGHT_STROKE, FLASH_ATTACK_MS, FLASH_COLOR, FLASH_HOLD_MS, FLASH_OVERSHOOT, FLASH_PADDING, FLASH_RADIUS, FLASH_RELEASE_MS, FLASH_STROKE_WIDTH, GOOGLE_FONTS_API_KEY, HANDLE_HALF_SIZE, HANDLE_HIT_RADIUS, IS_BROWSER, IS_TAURI, LABEL_FONT_SIZE, LABEL_OFFSET_Y, LAYOUT_INDICATOR_STROKE, MARQUEE_FILL_ALPHA, ModelOption, PARENT_OUTLINE_ALPHA, PARENT_OUTLINE_DASH, PEN_CLOSE_RADIUS_BOOST, PEN_CLOSE_THRESHOLD, PEN_HANDLE_RADIUS, PEN_PATH_STROKE_WIDTH, PEN_VERTEX_RADIUS, ROTATION_SNAP_DEGREES, RULER_BADGE_EXCLUSION, RULER_BADGE_HEIGHT, RULER_BADGE_PADDING, RULER_BADGE_RADIUS, RULER_BG_COLOR, RULER_HIGHLIGHT_ALPHA, RULER_MAJOR_TICK, RULER_MAJOR_TOLERANCE, RULER_MINOR_TICK, RULER_SIZE, RULER_TARGET_PIXEL_SPACING, RULER_TEXT_BASELINE, RULER_TEXT_COLOR, RULER_TICK_COLOR, SECTION_CORNER_RADIUS, SECTION_DEFAULT_FILL, SECTION_DEFAULT_STROKE, SECTION_TITLE_FONT_SIZE, SECTION_TITLE_GAP, SECTION_TITLE_HEIGHT, SECTION_TITLE_PADDING_X, SECTION_TITLE_RADIUS, SELECTION_COLOR, SELECTION_DASH_ALPHA, SIZE_FONT_SIZE, SIZE_PILL_HEIGHT, SIZE_PILL_PADDING_X, SIZE_PILL_PADDING_Y, SIZE_PILL_RADIUS, SIZE_PILL_TEXT_OFFSET_Y, SNAP_COLOR, SNAP_THRESHOLD, TEXT_CARET_COLOR, TEXT_CARET_WIDTH, TEXT_SELECTION_COLOR, TRANSPARENT, ZOOM_DIVISOR, ZOOM_SCALE_MAX, ZOOM_SCALE_MIN, getDefaultCanvasBgColor };
//# sourceMappingURL=constants.d.ts.map