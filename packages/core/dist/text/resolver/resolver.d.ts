import { FontResolutionDemand, FontResolutionLoader, FontResolutionSettled, FontResolutionSnapshot } from "./types.js";

//#region src/text/resolver/resolver.d.ts
declare class FontResolver {
  private readonly load;
  private readonly entries;
  constructor(load: FontResolutionLoader);
  state(demand: FontResolutionDemand | string): FontResolutionSnapshot;
  pendingNodeIds(demand: FontResolutionDemand | string): string[];
  demand(demand: FontResolutionDemand, onSettled?: FontResolutionSettled): Promise<FontResolutionSnapshot>;
  demandForNode(demand: FontResolutionDemand, nodeId: string, onSettled?: FontResolutionSettled): Promise<FontResolutionSnapshot>;
  retry(demand: FontResolutionDemand, onSettled?: FontResolutionSettled): Promise<FontResolutionSnapshot>;
  exhaust(demand: FontResolutionDemand): FontResolutionSnapshot;
  reset(demand?: FontResolutionDemand | string): void;
  private request;
  private addConsumer;
  private resolve;
  private settle;
}
//#endregion
export { FontResolver };
//# sourceMappingURL=resolver.d.ts.map