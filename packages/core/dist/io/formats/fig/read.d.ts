import { SceneGraph } from "@open-pencil/scene-graph";

//#region src/io/formats/fig/read.d.ts
interface ParseFigFileOptions {
  populate?: 'all' | 'first-page' | 'none';
}
declare function parseFigFile(buffer: ArrayBuffer, options?: ParseFigFileOptions): Promise<SceneGraph>;
declare function readFigFile(file: File, options?: ParseFigFileOptions): Promise<SceneGraph>;
//#endregion
export { ParseFigFileOptions, parseFigFile, readFigFile };
//# sourceMappingURL=read.d.ts.map