import { FigmaAPI } from "./index.js";

//#region src/figma-api/compatibility.d.ts
type Expect<T extends true> = T;
type IncompatibleKeys<Actual, Expected> = { [K in keyof Expected]: K extends keyof Actual ? (Actual[K] extends Expected[K] ? never : K) : K }[keyof Expected];
type SupportedPluginAPI = Pick<PluginAPI, 'base64Decode' | 'base64Encode' | 'loadFontAsync' | 'notify' | 'createComponent' | 'createEllipse' | 'createFrame' | 'createLine' | 'createPolygon' | 'createRectangle' | 'createSection' | 'createStar' | 'createText' | 'createVector' | 'exclude' | 'flatten' | 'group' | 'intersect' | 'subtract' | 'ungroup' | 'union'>;
type FigmaAPIIncompatibleKeys = IncompatibleKeys<FigmaAPI, SupportedPluginAPI>;
type FigmaAPICompatibility = Expect<FigmaAPIIncompatibleKeys extends never ? true : false>;
//#endregion
export { FigmaAPICompatibility, FigmaAPIIncompatibleKeys, SupportedPluginAPI };
//# sourceMappingURL=compatibility.d.ts.map