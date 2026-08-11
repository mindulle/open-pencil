import { VectorNetwork, WindingRule } from "@open-pencil/scene-graph";

//#region src/icons/types.d.ts
interface IconPath {
  vectorNetwork: VectorNetwork;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  strokeCap: string;
  strokeJoin: string;
}
interface IconData {
  prefix: string;
  name: string;
  width: number;
  height: number;
  paths: IconPath[];
}
interface IconifyIconEntry {
  body: string;
  width?: number;
  height?: number;
}
interface IconifyResponse {
  prefix: string;
  width?: number;
  height?: number;
  icons: {
    [key: string]: IconifyIconEntry | undefined;
  };
  aliases?: {
    [key: string]: {
      parent: string;
    } | undefined;
  };
}
interface IconSearchResult {
  icons: string[];
  total: number;
  collections: Record<string, {
    name: string;
    total: number;
    category?: string;
  }>;
}
interface IconPathInfo {
  d: string;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  strokeCap: string;
  strokeJoin: string;
  fillRule: WindingRule;
  /** Raw transform attribute from the source SVG element. */
  transform?: string | null;
}
//#endregion
export { IconData, IconPath, IconPathInfo, IconSearchResult, IconifyIconEntry, IconifyResponse };
//# sourceMappingURL=types.d.ts.map