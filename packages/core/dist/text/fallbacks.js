import { CJK_FALLBACK_FAMILIES_LINUX, CJK_FALLBACK_FAMILIES_MACOS, CJK_FALLBACK_FAMILIES_WINDOWS, CJK_GOOGLE_FONTS } from "../constants.js";
//#region src/text/fallbacks.ts
function cjkFallbackScriptForLanguage(language) {
	if (!language) return null;
	const normalized = language.toLowerCase().replaceAll("_", "-");
	const [primary] = normalized.split("-");
	if (primary === "ja") return "cjk-jp";
	if (primary === "ko") return "cjk-kr";
	if (primary !== "zh") return null;
	const subtags = new Set(normalized.split("-").slice(1));
	if (subtags.has("hant") || subtags.has("tw") || subtags.has("hk") || subtags.has("mo")) return "cjk-tc";
	return "cjk-sc";
}
const ARABIC_LOCAL_FALLBACK_FAMILIES = [
	"Noto Naskh Arabic",
	"Noto Sans Arabic",
	"Geeza Pro",
	"Arial",
	"Tahoma",
	"Amiri"
];
const ARABIC_REMOTE_FALLBACK_FAMILIES = ["Noto Naskh Arabic", "Noto Sans Arabic"];
function cjkLocalFallbackFamilies(userAgent) {
	if (!userAgent) return [...CJK_FALLBACK_FAMILIES_LINUX];
	if (userAgent.includes("Mac")) return [...CJK_FALLBACK_FAMILIES_MACOS];
	if (userAgent.includes("Windows")) return [...CJK_FALLBACK_FAMILIES_WINDOWS];
	return [...CJK_FALLBACK_FAMILIES_LINUX];
}
function platformCJKFamilies(userAgent, families) {
	if (!userAgent) return families.linux;
	if (userAgent.includes("Mac")) return families.mac;
	if (userAgent.includes("Windows")) return families.windows;
	return families.linux;
}
function cjkScriptLocalFallbackFamilies(script, userAgent) {
	switch (script) {
		case "cjk-tc": return platformCJKFamilies(userAgent, {
			mac: [
				"PingFang TC",
				"Heiti TC",
				"PingFang SC",
				"Hiragino Sans"
			],
			windows: [
				"Microsoft JhengHei",
				"Microsoft YaHei",
				"Microsoft YaHei UI",
				"SimSun"
			],
			linux: [
				"Noto Sans CJK TC",
				"Noto Sans CJK SC",
				"Droid Sans Fallback"
			]
		});
		case "cjk-jp": return platformCJKFamilies(userAgent, {
			mac: [
				"Hiragino Sans",
				"PingFang SC",
				"PingFang TC"
			],
			windows: [
				"Yu Gothic",
				"Microsoft YaHei",
				"Microsoft JhengHei"
			],
			linux: [
				"Noto Sans CJK JP",
				"Noto Sans CJK SC",
				"Droid Sans Fallback"
			]
		});
		case "cjk-kr": return platformCJKFamilies(userAgent, {
			mac: [
				"Apple SD Gothic Neo",
				"PingFang SC",
				"Hiragino Sans"
			],
			windows: [
				"Malgun Gothic",
				"Microsoft YaHei",
				"Yu Gothic"
			],
			linux: [
				"Noto Sans CJK KR",
				"Noto Sans CJK SC",
				"Droid Sans Fallback"
			]
		});
		default: return platformCJKFamilies(userAgent, {
			mac: [
				"PingFang SC",
				"Heiti SC",
				"PingFang TC",
				"Hiragino Sans"
			],
			windows: [
				"Microsoft YaHei",
				"Microsoft YaHei UI",
				"SimHei",
				"SimSun"
			],
			linux: [
				"Noto Sans CJK SC",
				"WenQuanYi Micro Hei",
				"Droid Sans Fallback"
			]
		});
	}
}
const CJK_SCRIPT_REMOTE_FAMILIES = {
	"cjk-sc": ["Noto Sans SC"],
	"cjk-tc": ["Noto Sans TC", "Noto Sans SC"],
	"cjk-jp": ["Noto Sans JP", "Noto Sans SC"],
	"cjk-kr": ["Noto Sans KR", "Noto Sans SC"]
};
function fontFallbackManifest(userAgent) {
	return {
		cjk: {
			script: "cjk",
			localFamilies: cjkLocalFallbackFamilies(userAgent),
			remoteFamilies: [...CJK_GOOGLE_FONTS]
		},
		"cjk-sc": {
			script: "cjk-sc",
			localFamilies: cjkScriptLocalFallbackFamilies("cjk-sc", userAgent),
			remoteFamilies: CJK_SCRIPT_REMOTE_FAMILIES["cjk-sc"]
		},
		"cjk-tc": {
			script: "cjk-tc",
			localFamilies: cjkScriptLocalFallbackFamilies("cjk-tc", userAgent),
			remoteFamilies: CJK_SCRIPT_REMOTE_FAMILIES["cjk-tc"]
		},
		"cjk-jp": {
			script: "cjk-jp",
			localFamilies: cjkScriptLocalFallbackFamilies("cjk-jp", userAgent),
			remoteFamilies: CJK_SCRIPT_REMOTE_FAMILIES["cjk-jp"]
		},
		"cjk-kr": {
			script: "cjk-kr",
			localFamilies: cjkScriptLocalFallbackFamilies("cjk-kr", userAgent),
			remoteFamilies: CJK_SCRIPT_REMOTE_FAMILIES["cjk-kr"]
		},
		arabic: {
			script: "arabic",
			localFamilies: [...ARABIC_LOCAL_FALLBACK_FAMILIES],
			remoteFamilies: [...ARABIC_REMOTE_FALLBACK_FAMILIES]
		}
	};
}
function fontFallbackEntry(script, userAgent) {
	return fontFallbackManifest(userAgent)[script];
}
//#endregion
export { ARABIC_LOCAL_FALLBACK_FAMILIES, ARABIC_REMOTE_FALLBACK_FAMILIES, cjkFallbackScriptForLanguage, cjkLocalFallbackFamilies, fontFallbackEntry, fontFallbackManifest };

//# sourceMappingURL=fallbacks.js.map