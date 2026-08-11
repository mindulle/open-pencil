import { SceneGraph, SceneNode } from "@open-pencil/scene-graph";
import { GUID, NodeChange, VariableConsumptionEntry } from "@open-pencil/kiwi/fig/codec";
import { Matrix, Vector } from "@open-pencil/scene-graph/primitives";

//#region src/instance-overrides/patches/protection.d.ts
type ProtectedField = 'text' | 'visible' | 'opacity' | 'fills' | 'strokes' | 'effects' | 'styleRuns' | 'layoutGrow' | 'textAutoResize' | 'locked' | 'x' | 'y' | 'width' | 'height' | 'figmaDerivedLayout' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fillGeometry' | 'strokeGeometry' | 'structure';
type ProtectionMap = Map<string, Set<ProtectedField>>;
declare function protectField(protections: ProtectionMap, nodeId: string, field: ProtectedField): void;
//#endregion
//#region src/instance-overrides/types.d.ts
interface VariableConsumptionMapFields {
  variableConsumptionMap?: {
    entries?: VariableConsumptionEntry[];
  };
  [key: string]: unknown;
}
interface SymbolOverride extends VariableConsumptionMapFields {
  guidPath?: {
    guids?: GUID[];
  };
  overriddenSymbolID?: GUID;
  componentPropAssignments?: ComponentPropAssignment[];
}
interface SymbolData {
  symbolID?: GUID;
  symbolOverrides?: SymbolOverride[];
}
interface ComponentPropRef {
  defID?: GUID;
  componentPropNodeField: string;
}
type ComponentPropTextValue = string | {
  characters?: string;
};
type ComponentPropValue = {
  boolValue?: boolean;
  textValue?: ComponentPropTextValue;
  textDataValue?: {
    characters?: string;
  };
  guidValue?: GUID;
};
interface ComponentPropAssignment {
  defID?: GUID;
  value: ComponentPropValue;
  varValue?: {
    value?: {
      boolValue?: boolean;
      textValue?: string;
      textDataValue?: {
        characters?: string;
      };
      symbolIdValue?: {
        guid?: GUID;
      };
    };
  };
}
interface DerivedSymbolOverride {
  guidPath?: {
    guids?: GUID[];
  };
  size?: Vector;
  transform?: Matrix;
  fontSize?: number;
  lineHeight?: NodeChange['lineHeight'];
  letterSpacing?: NodeChange['letterSpacing'];
  strokeWeight?: number;
  derivedTextData?: NodeChange['derivedTextData'];
  vectorData?: NodeChange['vectorData'];
  fillGeometry?: NodeChange['fillGeometry'];
  strokeGeometry?: NodeChange['strokeGeometry'];
}
interface ComponentPropDef {
  id?: GUID;
  name?: string;
  initialValue?: ComponentPropValue;
  type?: number;
}
interface InstanceNodeChange {
  type?: string;
  name?: string;
  guid?: GUID;
  parentIndex?: {
    guid?: GUID;
  };
  transform?: Matrix;
  size?: Vector;
  overrideKey?: GUID;
  symbolData?: SymbolData;
  componentPropRefs?: ComponentPropRef[];
  componentPropAssignments?: ComponentPropAssignment[];
  componentPropDefs?: ComponentPropDef[];
  styleType?: string;
  fillPaints?: NodeChange['fillPaints'];
  strokePaints?: NodeChange['strokePaints'];
  fillGeometry?: NodeChange['fillGeometry'];
  strokeGeometry?: NodeChange['strokeGeometry'];
  strokeWeight?: number;
  derivedSymbolData?: DerivedSymbolOverride[];
  key?: string;
  version?: string;
  userFacingVersion?: string;
  variableDataValues?: NodeChange['variableDataValues'];
}
/**
 * Shared state for override resolution.
 *
 * Built once in `populateAndApplyOverrides` and threaded through all
 * sub-functions. Avoids closure-based coupling (a single 700-line
 * function) while keeping the shared maps accessible.
 */
interface OverrideContext {
  graph: SceneGraph;
  changeMap: Map<string, InstanceNodeChange>;
  guidToNodeId: Map<string, string>;
  blobs: Uint8Array[];
  overrideKeyToGuid: Map<string, string>;
  assetRefToGuid: Map<string, string>;
  nodeIdToGuid: Map<string, string>;
  propDefaults: Map<string, ComponentPropValue>;
  propNames: Map<string, string>;
  componentPropRefsMap?: Map<string, ComponentPropRef[]>;
  componentPropAssignmentsMap?: Map<string, ComponentPropAssignment[]>;
  preComputedRoot: Map<string, string>;
  preComputedClones: Map<string, string[]>;
  componentIdRoot: Map<string, string>;
  swappedInstances: Set<string>;
  protectedFields: ProtectionMap;
  /** Nodes whose kiwi NC has explicit property values (cornerRadius, visibility, etc.) */
  kiwiPropertyNodes: Set<string>;
  /** Nodes whose Figma-derived geometry should not be overwritten by clone propagation. */
  geometryOverrideNodes: Set<string>;
  /** When set, apply/populate expensive instance work only inside these already-imported nodes. */
  activeNodeIds?: Set<string>;
}
//#endregion
//#region src/instance-overrides/derived-symbol-data/layout.d.ts
declare function buildDsdLayoutUpdates(ctx: OverrideContext, _visibleSiblingCount: Map<string, number>, d: DerivedSymbolOverride, target: SceneNode): {
  updates: Partial<SceneNode>;
  hasSize: boolean;
};
//#endregion
//#region src/instance-overrides/derived-symbol-data/propagate.d.ts
declare function applyGeneratedFreeformStretch(ctx: OverrideContext): void;
declare function propagateDsdChanges(ctx: OverrideContext, modified: Set<string>, sizeSet: Set<string>): void;
//#endregion
//#region src/instance-overrides/sync/fields.d.ts
declare function syncNodeProps(graph: SceneGraph, source: SceneNode, target: SceneNode, protections?: ProtectionMap): void;
//#endregion
//#region src/instance-overrides/sync/clones.d.ts
declare function syncChildrenDeep(graph: SceneGraph, sourceId: string, targetId: string, swappedInstances: Set<string>, skip?: Set<string>, protections?: ProtectionMap, cloneSources?: Map<string, string[]>, activeNodeIds?: Set<string>): void;
//#endregion
//#region src/instance-overrides/index.d.ts
/**
 *
 * Shared between .fig file import and clipboard paste. Both paths produce
 * a SceneGraph with INSTANCE nodes whose componentId references have been
 * remapped to graph node IDs but whose children may be missing and whose
 * overrides have not yet been applied.
 *
 * Resolution order:
 * 1. Populate — clone component trees into empty instances
 * 2. Symbol overrides — set property values and swap instances
 * 3. Transitive sync — propagate overrides through clone chains
 * 4. Component properties — toggle visibility / swap via prop assignments
 * 5. Second transitive sync — propagate property changes to deeper clones
 * 6. Derived symbol data — apply Figma's pre-computed sizes last
 */
declare function populateAndApplyOverrides(graph: SceneGraph, changeMap: Map<string, InstanceNodeChange>, guidToNodeId: Map<string, string>, blobs?: Uint8Array[], activeRootIds?: Iterable<string>): void;
//#endregion
export { type ComponentPropAssignment, type ComponentPropDef, type ComponentPropRef, type ComponentPropValue, type DerivedSymbolOverride, type InstanceNodeChange, type OverrideContext, type ProtectionMap, type SymbolData, type SymbolOverride, applyGeneratedFreeformStretch, buildDsdLayoutUpdates, populateAndApplyOverrides, propagateDsdChanges, protectField, syncChildrenDeep, syncNodeProps };
//# sourceMappingURL=instance-overrides.d.ts.map