//#region src/text/resolver/resolver.ts
function idleSnapshot(key) {
	return {
		key,
		state: "idle"
	};
}
var FontResolver = class {
	load;
	entries = /* @__PURE__ */ new Map();
	constructor(load) {
		this.load = load;
	}
	state(demand) {
		const key = typeof demand === "string" ? demand : demand.key;
		return this.entries.get(key)?.snapshot ?? idleSnapshot(key);
	}
	pendingNodeIds(demand) {
		const key = typeof demand === "string" ? demand : demand.key;
		const entry = this.entries.get(key);
		return entry?.snapshot.state === "loading" ? [...entry.nodeIds] : [];
	}
	demand(demand, onSettled) {
		return this.request(demand, onSettled);
	}
	demandForNode(demand, nodeId, onSettled) {
		return this.request(demand, onSettled, nodeId);
	}
	retry(demand, onSettled) {
		if (this.state(demand).state !== "failed") return this.demand(demand, onSettled);
		this.entries.delete(demand.key);
		return this.demand(demand, onSettled);
	}
	exhaust(demand) {
		const current = this.entries.get(demand.key);
		if (current?.snapshot.state === "loading") return current.snapshot;
		const snapshot = {
			key: demand.key,
			state: "exhausted"
		};
		if (current) {
			current.snapshot = snapshot;
			current.promise = Promise.resolve(snapshot);
			current.callbacks.clear();
			current.nodeIds.clear();
			return snapshot;
		}
		const entry = {
			demand,
			snapshot,
			promise: Promise.resolve(snapshot),
			callbacks: /* @__PURE__ */ new Map(),
			nodeIds: /* @__PURE__ */ new Set()
		};
		this.entries.set(demand.key, entry);
		return snapshot;
	}
	reset(demand) {
		if (demand === void 0) {
			this.entries.clear();
			return;
		}
		this.entries.delete(typeof demand === "string" ? demand : demand.key);
	}
	request(demand, onSettled, nodeId) {
		const current = this.entries.get(demand.key);
		if (current) {
			if (current.snapshot.state === "loading") this.addConsumer(current, onSettled, nodeId);
			return current.promise;
		}
		const snapshot = {
			key: demand.key,
			state: "loading"
		};
		const entry = {
			demand,
			snapshot,
			callbacks: /* @__PURE__ */ new Map(),
			nodeIds: /* @__PURE__ */ new Set(),
			promise: Promise.resolve(snapshot)
		};
		this.addConsumer(entry, onSettled, nodeId);
		this.entries.set(demand.key, entry);
		entry.promise = this.resolve(entry);
		return entry.promise;
	}
	addConsumer(entry, onSettled, nodeId) {
		if (nodeId) entry.nodeIds.add(nodeId);
		if (!onSettled) return;
		const callbackNodes = entry.callbacks.get(onSettled) ?? /* @__PURE__ */ new Set();
		if (nodeId) callbackNodes.add(nodeId);
		entry.callbacks.set(onSettled, callbackNodes);
	}
	async resolve(entry) {
		for (const candidate of entry.demand.candidates) {
			if (this.entries.get(entry.demand.key) !== entry) return idleSnapshot(entry.demand.key);
			entry.snapshot = {
				key: entry.demand.key,
				state: "loading",
				candidate
			};
			try {
				if (await this.load(candidate, entry.demand)) return this.settle(entry, {
					key: entry.demand.key,
					state: "loaded",
					candidate,
					source: candidate.source
				});
			} catch (error) {
				return this.settle(entry, {
					key: entry.demand.key,
					state: "failed",
					candidate,
					source: candidate.source,
					error
				});
			}
		}
		return this.settle(entry, {
			key: entry.demand.key,
			state: "exhausted"
		});
	}
	settle(entry, snapshot) {
		if (this.entries.get(entry.demand.key) !== entry) return idleSnapshot(entry.demand.key);
		entry.snapshot = snapshot;
		for (const [callback, nodeIds] of entry.callbacks) try {
			callback(snapshot, [...nodeIds]);
		} catch (error) {
			console.error("Font resolution callback failed:", error);
		}
		entry.callbacks.clear();
		entry.nodeIds.clear();
		return snapshot;
	}
};
//#endregion
export { FontResolver };

//# sourceMappingURL=resolver.js.map