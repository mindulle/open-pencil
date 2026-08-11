//#region src/fig/guid.ts
function guidToString(guid) {
	return `${guid.sessionID}:${guid.localID}`;
}
function stringToGuid(str) {
	const match = str.match(/^(?:VariableID:|VariableCollectionId:)?(\d+):(\d+)$/);
	if (match) return {
		sessionID: Number.parseInt(match[1], 10),
		localID: Number.parseInt(match[2], 10)
	};
	const [session, local] = str.split(":");
	return {
		sessionID: Number.parseInt(session, 10),
		localID: Number.parseInt(local, 10)
	};
}
//#endregion
export { guidToString, stringToGuid };

//# sourceMappingURL=guid.js.map