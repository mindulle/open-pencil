import { FigmaSourcePayload, SceneNode } from "@open-pencil/scene-graph";
import { NodeChange } from "@open-pencil/kiwi/fig/codec";

//#region src/archive.d.ts
interface FigImageEntry {
  name: string;
  data: Uint8Array;
}
interface WriteFigArchiveInput {
  schemaDeflated: Uint8Array;
  kiwiData: Uint8Array;
  thumbnailPNG: Uint8Array;
  metaJSON: string;
  images?: FigImageEntry[];
  figKiwiVersion?: number;
}
interface FigParseResult {
  nodeChanges: NodeChange[];
  blobs: Uint8Array[];
  images: Array<[string, Uint8Array]>;
  figKiwiVersion: number;
  /** Deflated Kiwi schema bytes from the original file, retained for round-trip fidelity. */
  figSchemaDeflated: Uint8Array;
  thumbnailPNG: Uint8Array | null;
  metaJSON: string | null;
}
/** Parse a complete zipped `.fig` file into its Figma protocol payload and binary resources. */
declare function parseFigBuffer(buffer: ArrayBuffer): FigParseResult;
/** Assemble a complete zipped `.fig` archive from an encoded Kiwi message and resources. */
declare function writeFigArchive(input: WriteFigArchiveInput): Uint8Array;
/** Compatibility signature used by core while archive assembly migrates to this package. */
declare function compressFigDataSync(schemaDeflated: Uint8Array, kiwiData: Uint8Array, thumbnailPNG: Uint8Array, metaJSON: string, imageEntries: FigImageEntry[], figKiwiVersion?: number): Uint8Array;
//#endregion
//#region src/thumbnail.d.ts
interface FigRangeReader {
  readonly size: number;
  read(start: number, endExclusive: number): Promise<Uint8Array>;
}
type FigThumbnailLimits = {
  maxTailBytes?: number;
  maxCompressedBytes?: number;
  maxOutputBytes?: number;
};
/**
 * Extract Figma's canonical `thumbnail.png` from a remote `.fig` ZIP through
 * bounded range reads. The complete document is never requested.
 */
declare function extractFigThumbnailFromReader(reader: FigRangeReader, limits?: FigThumbnailLimits): Promise<Uint8Array | null>;
//#endregion
//#region src/source-metadata.d.ts
interface FigmaSourceCarrier {
  source: Omit<SceneNode['source'], 'editedFields'> & Partial<Pick<SceneNode['source'], 'editedFields'>>;
}
declare function staleFigmaRawFields(editedFields?: readonly string[]): ReadonlySet<string>;
declare function effectiveFigmaRawNodeFields(node: FigmaSourceCarrier): Record<string, unknown>;
declare function effectiveFigmaSourcePayload(node: FigmaSourceCarrier): FigmaSourcePayload;
declare function readEffectiveFigmaRawField(node: FigmaSourceCarrier, field: string): unknown;
//#endregion
//#region src/index.d.ts
interface FigDocumentSource {
  readonly bytes?: Uint8Array;
  readonly fileName?: string;
}
interface FigDocument<Graph = unknown> {
  readonly graph: Graph;
  readonly source?: FigDocumentSource;
}
interface ReadFigOptions {
  readonly preserveRawMetadata?: boolean;
}
interface WriteFigOptions {
  readonly source?: FigDocumentSource;
}
interface FigContainerDocument {
  readonly schemaDeflated: Uint8Array;
  readonly dataRaw: Uint8Array;
  readonly source?: FigDocumentSource;
}
interface ReadFigContainerOptions {
  readonly fileName?: string;
}
interface WriteFigContainerOptions {
  readonly version?: number;
}
declare const FIG_PACKAGE_STATUS: "archive-api";
declare function readFigContainer(bytes: Uint8Array, options?: ReadFigContainerOptions): FigContainerDocument;
declare function writeFigContainer(document: FigContainerDocument, options?: WriteFigContainerOptions): Uint8Array;
declare function assertFigPackageReady(): void;
//#endregion
export { FIG_PACKAGE_STATUS, FigContainerDocument, FigDocument, FigDocumentSource, type FigImageEntry, type FigParseResult, type FigRangeReader, type FigThumbnailLimits, ReadFigContainerOptions, ReadFigOptions, type WriteFigArchiveInput, WriteFigContainerOptions, WriteFigOptions, assertFigPackageReady, compressFigDataSync, effectiveFigmaRawNodeFields, effectiveFigmaSourcePayload, extractFigThumbnailFromReader, parseFigBuffer, readEffectiveFigmaRawField, readFigContainer, staleFigmaRawFields, writeFigArchive, writeFigContainer };
//# sourceMappingURL=index.d.ts.map