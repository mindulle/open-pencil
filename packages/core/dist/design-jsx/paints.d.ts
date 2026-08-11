import { BlendMode, Fill, FillType, GradientTransform } from "@open-pencil/scene-graph";
import { Color as Color$1 } from "@open-pencil/scene-graph/primitives";

//#region src/design-jsx/paints.d.ts
type PaintColor = string | Color$1;
type PaintStop = readonly [PaintColor, number] | {
  color: PaintColor;
  position: number;
};
interface SolidPaintOptions {
  opacity?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}
interface GradientPaintOptions extends SolidPaintOptions {
  transform?: GradientTransform;
}
declare function solid(color: PaintColor, options?: SolidPaintOptions): Fill;
declare function gradient(type: Extract<FillType, 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND'>, stops: PaintStop[], options?: GradientPaintOptions): Fill;
declare function linearGradient(stops: PaintStop[], options?: GradientPaintOptions): Fill;
declare function radialGradient(stops: PaintStop[], options?: GradientPaintOptions): Fill;
declare function angularGradient(stops: PaintStop[], options?: GradientPaintOptions): Fill;
declare function diamondGradient(stops: PaintStop[], options?: GradientPaintOptions): Fill;
//#endregion
export { GradientPaintOptions, PaintColor, PaintStop, SolidPaintOptions, angularGradient, diamondGradient, gradient, linearGradient, radialGradient, solid };
//# sourceMappingURL=paints.d.ts.map