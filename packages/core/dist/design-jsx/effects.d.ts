import { BlendMode, Effect } from "@open-pencil/scene-graph";
import { Color as Color$1, Vector as Vector$1 } from "@open-pencil/scene-graph/primitives";

//#region src/design-jsx/effects.d.ts
type EffectColor = string | Color$1;
interface ShadowEffectOptions {
  color?: EffectColor;
  x?: number;
  y?: number;
  offset?: Vector$1;
  radius?: number;
  spread?: number;
  visible?: boolean;
  blendMode?: BlendMode;
  showShadowBehindNode?: boolean;
}
interface BlurEffectOptions {
  radius?: number;
  visible?: boolean;
}
declare function dropShadow(options?: ShadowEffectOptions): Effect;
declare function innerShadow(options?: ShadowEffectOptions): Effect;
declare function layerBlur(radiusOrOptions?: number | BlurEffectOptions): Effect;
declare function backgroundBlur(radiusOrOptions?: number | BlurEffectOptions): Effect;
declare function foregroundBlur(radiusOrOptions?: number | BlurEffectOptions): Effect;
//#endregion
export { BlurEffectOptions, EffectColor, ShadowEffectOptions, backgroundBlur, dropShadow, foregroundBlur, innerShadow, layerBlur };
//# sourceMappingURL=effects.d.ts.map