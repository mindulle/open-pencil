//#region src/io/registry.ts
var IORegistry = class {
	adapters;
	constructor(adapters) {
		this.adapters = adapters;
	}
	listFormats() {
		return this.adapters;
	}
	getFormat(id) {
		return this.adapters.find((adapter) => adapter.id === id) ?? null;
	}
	listReadableFormats() {
		return this.adapters.filter((adapter) => adapter.support.readDocument);
	}
	listWritableFormats() {
		return this.adapters.filter((adapter) => adapter.support.writeDocument);
	}
	listExportFormats(scope) {
		return this.adapters.filter((adapter) => {
			switch (scope) {
				case "document": return !!adapter.support.exportDocument;
				case "page": return !!adapter.support.exportPage;
				case "selection": return !!adapter.support.exportSelection;
				case "node": return !!adapter.support.exportNode;
				default: return false;
			}
		});
	}
	findReader(fileName, mimeType) {
		return this.adapters.find((adapter) => {
			if (!adapter.support.readDocument) return false;
			if (adapter.matchesFile) return adapter.matchesFile(fileName, mimeType);
			const lower = fileName.toLowerCase();
			return adapter.extensions.some((ext) => lower.endsWith(`.${ext}`));
		}) ?? null;
	}
	async readDocument(input, context) {
		const reader = this.findReader(input.name ?? "", input.mimeType);
		if (!reader?.readDocument) throw new Error(`Unsupported document format: ${input.name ?? "unknown"}`);
		return reader.readDocument(input, context);
	}
	async writeDocument(formatId, graph, options, context) {
		const adapter = this.getFormat(formatId);
		if (!adapter?.writeDocument) throw new Error(`Format does not support writeDocument: ${formatId}`);
		return adapter.writeDocument(graph, options, context);
	}
	async exportContent(formatId, request, options, context) {
		const adapter = this.getFormat(formatId);
		if (!adapter?.exportContent) throw new Error(`Format does not support exportContent: ${formatId}`);
		return adapter.exportContent(request, options, context);
	}
};
//#endregion
export { IORegistry };

//# sourceMappingURL=registry.js.map