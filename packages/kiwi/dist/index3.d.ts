import { Schema } from "./index.js";

//#region src/fig/schema.d.ts
declare const schema: Schema;
//#endregion
//#region src/fig/protocol.d.ts
/**
 * Figma Multiplayer Protocol
 *
 * This module handles the low-level WebSocket communication with Figma's
 * multiplayer server. The protocol uses:
 *
 * - Kiwi binary serialization (schema-based, like Protocol Buffers)
 * - Zstd compression for all messages
 * - Session-based authentication via cookies
 *
 * Message types (from Figma's schema):
 *   0 = JOIN_START     - Server sends session info
 *   1 = NODE_CHANGES   - Create/update/delete nodes
 *   2 = USER_CHANGES   - User presence updates
 *   3 = JOIN_END       - Initial sync complete
 *   4 = SIGNAL         - Various metadata (reconnect info, etc.)
 *   5 = STYLE          - Style updates
 *   ...and more
 *
 * Wire format:
 *   All messages are Zstd-compressed Kiwi-encoded binary data.
 *   Zstd magic bytes: 0x28 0xB5 0x2F 0xFD
 */
declare const MESSAGE_TYPES: {
  readonly JOIN_START: 0;
  readonly NODE_CHANGES: 1;
  readonly USER_CHANGES: 2;
  readonly JOIN_END: 3;
  readonly SIGNAL: 4;
  readonly STYLE: 5;
  readonly STYLE_SET: 6;
  readonly JOIN_START_SKIP_RELOAD: 7;
  readonly NOTIFY_SHOULD_UPGRADE: 8;
  readonly UPGRADE_DONE: 9;
  readonly UPGRADE_REFRESH: 10;
  readonly SCENE_GRAPH_QUERY: 11;
  readonly SCENE_GRAPH_REPLY: 12;
  readonly DIFF: 13;
  readonly CLIENT_BROADCAST: 14;
};
declare const NODE_TYPES: {
  readonly NONE: 0;
  readonly DOCUMENT: 1;
  readonly CANVAS: 2;
  readonly GROUP: 3;
  readonly FRAME: 4;
  readonly BOOLEAN_OPERATION: 5;
  readonly VECTOR: 6;
  readonly STAR: 7;
  readonly LINE: 8;
  readonly ELLIPSE: 9;
  readonly RECTANGLE: 10;
  readonly REGULAR_POLYGON: 11;
  readonly ROUNDED_RECTANGLE: 12;
  readonly TEXT: 13;
  readonly SLICE: 14;
  readonly SYMBOL: 15;
  readonly INSTANCE: 16;
  readonly STICKY: 17;
  readonly SHAPE_WITH_TEXT: 18;
  readonly CONNECTOR: 19;
  readonly CODE_BLOCK: 20;
  readonly WIDGET: 21;
  readonly STAMP: 22;
  readonly MEDIA: 23;
  readonly HIGHLIGHT: 24;
  readonly SECTION: 25;
  readonly SECTION_OVERLAY: 26;
  readonly WASHI_TAPE: 27;
  readonly VARIABLE: 28;
};
declare const NODE_PHASES: {
  readonly CREATED: 0;
  readonly REMOVED: 1;
};
declare const BLEND_MODES: {
  readonly PASS_THROUGH: 0;
  readonly NORMAL: 1;
  readonly DARKEN: 2;
  readonly MULTIPLY: 3;
  readonly LINEAR_BURN: 4;
  readonly COLOR_BURN: 5;
  readonly LIGHTEN: 6;
  readonly SCREEN: 7;
  readonly LINEAR_DODGE: 8;
  readonly COLOR_DODGE: 9;
  readonly OVERLAY: 10;
  readonly SOFT_LIGHT: 11;
  readonly HARD_LIGHT: 12;
  readonly DIFFERENCE: 13;
  readonly EXCLUSION: 14;
  readonly HUE: 15;
  readonly SATURATION: 16;
  readonly COLOR: 17;
  readonly LUMINOSITY: 18;
};
declare const PAINT_TYPES: {
  readonly SOLID: 0;
  readonly GRADIENT_LINEAR: 1;
  readonly GRADIENT_RADIAL: 2;
  readonly GRADIENT_ANGULAR: 3;
  readonly GRADIENT_DIAMOND: 4;
  readonly IMAGE: 5;
  readonly EMOJI: 6;
  readonly VIDEO: 7;
};
/**
 * Zstd magic bytes
 */
declare const ZSTD_MAGIC: Uint8Array<ArrayBuffer>;
/**
 * Kiwi uses field numbers to identify message fields.
 * Field 1 with value = message type indicates the message kind.
 */
declare const KIWI: {
  /** First byte of valid Kiwi messages (field number 1) */readonly MESSAGE_MARKER: 1; /** Field number for sessionID in JOIN_START message */
  readonly SESSION_ID_FIELD: 2; /** Varint continuation bit (MSB set = more bytes follow) */
  readonly VARINT_CONTINUE_BIT: 128; /** Varint value mask (lower 7 bits contain data) */
  readonly VARINT_VALUE_MASK: 127; /** Bits per varint byte */
  readonly VARINT_BITS_PER_BYTE: 7;
};
/**
 * Valid session ID range (based on observed Figma behavior)
 */
declare const SESSION_ID: {
  readonly MIN: 10000;
  readonly MAX: 1000000;
};
/**
 * Parse a varint from a Uint8Array at given position
 * Returns [value, newPosition]
 */
declare function parseVarint(data: Uint8Array, pos: number): [number, number];
/**
 * Check if data is a valid Kiwi message
 */
declare function isKiwiMessage(data: Uint8Array): boolean;
/**
 * Get message type from Kiwi message
 */
declare function getKiwiMessageType(data: Uint8Array): number | null;
/**
 * fig-wire header magic (first 8 bytes of some messages)
 */
declare const FIG_WIRE_MAGIC = "fig-wire";
/**
 * Check if data is Zstd-compressed
 */
declare function isZstdCompressed(data: Uint8Array): boolean;
/**
 * Check if data has fig-wire header
 */
declare function hasFigWireHeader(data: Uint8Array): boolean;
/**
 * Skip fig-wire header and find zstd data
 * Header format: "fig-wire" (8 bytes) + version (4 bytes LE) + zstd data
 */
declare function skipFigWireHeader(data: Uint8Array): Uint8Array;
/**
 * Current multiplayer protocol version
 */
declare const PROTOCOL_VERSION = 151;
/**
 * Build WebSocket URL for Figma multiplayer
 */
declare function buildMultiplayerURL(fileKey: string, trackingId?: string): string;
//#endregion
export { BLEND_MODES, FIG_WIRE_MAGIC, KIWI, MESSAGE_TYPES, NODE_PHASES, NODE_TYPES, PAINT_TYPES, PROTOCOL_VERSION, SESSION_ID, ZSTD_MAGIC, buildMultiplayerURL, getKiwiMessageType, hasFigWireHeader, isKiwiMessage, isZstdCompressed, parseVarint, schema, skipFigWireHeader };
//# sourceMappingURL=index3.d.ts.map