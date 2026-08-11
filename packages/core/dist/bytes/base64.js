import { decode, encode, fromUint8Array, isValid, toUint8Array } from "js-base64";
//#region src/bytes/base64.ts
function assertValidBase64(value) {
	if (!isValid(value)) throw new TypeError("Invalid Base64 string");
}
/** Encode binary data without converting it through a JavaScript string. */
function encodeBase64(bytes, alphabet = "base64") {
	return fromUint8Array(bytes, alphabet === "base64url");
}
/** Decode standard or URL-safe Base64 into binary data. */
function decodeBase64(value) {
	assertValidBase64(value);
	return toUint8Array(value);
}
/** Encode a Unicode string as UTF-8 Base64. */
function encodeBase64Text(value, alphabet = "base64") {
	return encode(value, alphabet === "base64url");
}
/** Decode standard or URL-safe UTF-8 Base64 into a Unicode string. */
function decodeBase64Text(value) {
	assertValidBase64(value);
	return decode(value);
}
//#endregion
export { decodeBase64, decodeBase64Text, encodeBase64, encodeBase64Text };

//# sourceMappingURL=base64.js.map