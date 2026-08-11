//#region src/bytes/base64.d.ts
type Base64Alphabet = 'base64' | 'base64url';
/** Encode binary data without converting it through a JavaScript string. */
declare function encodeBase64(bytes: Uint8Array, alphabet?: Base64Alphabet): string;
/** Decode standard or URL-safe Base64 into binary data. */
declare function decodeBase64(value: string): Uint8Array;
/** Encode a Unicode string as UTF-8 Base64. */
declare function encodeBase64Text(value: string, alphabet?: Base64Alphabet): string;
/** Decode standard or URL-safe UTF-8 Base64 into a Unicode string. */
declare function decodeBase64Text(value: string): string;
//#endregion
export { Base64Alphabet, decodeBase64, decodeBase64Text, encodeBase64, encodeBase64Text };
//# sourceMappingURL=base64.d.ts.map