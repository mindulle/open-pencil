import { safeDestr } from "destr";
//#region src/tools/stock-photo/requests.ts
function parsePhotoRequests(value) {
	let parsed;
	try {
		parsed = safeDestr(String(value));
	} catch {
		return { error: "Invalid JSON in requests" };
	}
	const requests = Array.isArray(parsed) ? parsed : [parsed];
	if (requests.length === 0) return { error: "Empty requests array" };
	return requests;
}
//#endregion
export { parsePhotoRequests };

//# sourceMappingURL=requests.js.map