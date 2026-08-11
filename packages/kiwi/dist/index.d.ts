//#region src/schema-runtime/schema.d.ts
interface Schema {
  package: string | null;
  definitions: Definition[];
}
type DefinitionKind = 'ENUM' | 'STRUCT' | 'MESSAGE';
interface Definition {
  name: string;
  line: number;
  column: number;
  kind: DefinitionKind;
  fields: Field[];
}
interface Field {
  name: string;
  line: number;
  column: number;
  type: string | null;
  isArray: boolean;
  isDeprecated: boolean;
  value: number;
}
//#endregion
//#region src/schema-runtime/bb.d.ts
declare class ByteBuffer {
  private _data;
  private _index;
  length: number;
  constructor(data?: Uint8Array);
  /**
   * Returns a view into the internal buffer, not a copy.
   *
   * Consumers transferring this Uint8Array across thread boundaries (e.g. via
   * postMessage with transferables) MUST copy first: `new Uint8Array(buffer)`.
   * Otherwise, if multiple Uint8Arrays share the same underlying ArrayBuffer and
   * one is transferred, all views into that buffer become detached.
   */
  toUint8Array(): Uint8Array;
  readByte(): number;
  readByteArray(): Uint8Array;
  readVarFloat(): number;
  readVarUint(): number;
  readVarInt(): number;
  readVarUint64(): bigint;
  readVarInt64(): bigint;
  readString(): string;
  private _growBy;
  writeByte(value: number): void;
  writeByteArray(value: Uint8Array): void;
  writeVarFloat(value: number): void;
  writeVarUint(value: number): void;
  writeVarInt(value: number): void;
  writeVarUint64(value: bigint | string): void;
  writeVarInt64(value: bigint | string): void;
  writeString(value: string): void;
}
//#endregion
//#region src/schema-runtime/js.d.ts
declare function compileSchema(schema: Schema): any;
//#endregion
//#region src/schema-runtime/binary.d.ts
declare function decodeBinarySchema(buffer: Uint8Array | ByteBuffer): Schema;
declare function encodeBinarySchema(schema: Schema): Uint8Array;
//#endregion
//#region src/schema-runtime/parser.d.ts
declare function parseSchema(text: string): Schema;
//#endregion
//#region src/schema-runtime/validate.d.ts
declare function findDefinition(schema: Schema, name: string): Definition | null;
declare function findField(schema: Schema, definitionName: string, fieldName: string): Field | null;
declare function expectFieldNumber(schema: Schema, definitionName: string, fieldName: string, expectedValue: number): void;
declare function expectEnumValue(schema: Schema, enumName: string, memberName: string, expectedValue: number): void;
declare function validateSchema(schema: Schema): void;
//#endregion
export { ByteBuffer, Definition, Field, Schema, compileSchema, decodeBinarySchema, encodeBinarySchema, expectEnumValue, expectFieldNumber, findDefinition, findField, parseSchema, validateSchema };
//# sourceMappingURL=index.d.ts.map