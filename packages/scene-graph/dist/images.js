//#region src/images.ts
function computeImageHash(data) {
	let h1 = 2166136261;
	let h2 = 2166136261;
	let h3 = 2166136261;
	let h4 = 2166136261;
	let h5 = 2166136261;
	for (let i = 0; i < data.length; i++) {
		const b = data[i];
		switch (i % 5) {
			case 0:
				h1 ^= b;
				h1 = Math.imul(h1, 16777619) >>> 0;
				break;
			case 1:
				h2 ^= b;
				h2 = Math.imul(h2, 16777619) >>> 0;
				break;
			case 2:
				h3 ^= b;
				h3 = Math.imul(h3, 16777619) >>> 0;
				break;
			case 3:
				h4 ^= b;
				h4 = Math.imul(h4, 16777619) >>> 0;
				break;
			default:
				h5 ^= b;
				h5 = Math.imul(h5, 16777619) >>> 0;
				break;
		}
	}
	h5 = Math.imul(h5 ^ data.length, 16777619) >>> 0;
	return [
		h1,
		h2,
		h3,
		h4,
		h5
	].map((hash) => hash.toString(16).padStart(8, "0")).join("");
}
//#endregion
export { computeImageHash };

//# sourceMappingURL=images.js.map