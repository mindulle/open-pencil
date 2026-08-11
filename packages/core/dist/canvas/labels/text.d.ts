import { Font } from "canvaskit-wasm";

//#region src/canvas/labels/text.d.ts
declare function measureLabelText(font: Font, text: string): number;
declare function ellipsizeLabelText(font: Font, text: string, maxWidth: number): string;
//#endregion
export { ellipsizeLabelText, measureLabelText };
//# sourceMappingURL=text.d.ts.map