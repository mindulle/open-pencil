import { Severity } from "./types.js";

//#region src/lint/presets.d.ts
type RuleConfig = Severity | {
  severity: Severity;
  options?: Record<string, unknown>;
};
interface Preset {
  rules: Record<string, RuleConfig>;
}
declare const recommended: Preset;
declare const strict: Preset;
declare const accessibility: Preset;
declare const presets: Record<string, Preset>;
//#endregion
export { Preset, accessibility, presets, recommended, strict };
//# sourceMappingURL=presets.d.ts.map