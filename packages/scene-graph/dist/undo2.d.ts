//#region src/undo.d.ts
interface UndoEntry {
  label: string;
  forward: () => void;
  inverse: () => void;
  coalesceKey?: string;
}
interface UndoManagerOptions {
  limit?: number;
}
declare class UndoManager {
  private undoStack;
  private redoStack;
  private batches;
  private readonly limit;
  constructor(options?: UndoManagerOptions);
  apply(entry: UndoEntry): void;
  execute(entry: UndoEntry): void;
  push(entry: UndoEntry): void;
  record(entry: UndoEntry): void;
  undo(): string | null;
  redo(): string | null;
  beginBatch(label: string, coalesceKey?: string): void;
  commitBatch(): void;
  runBatch<T>(label: string, fn: () => T, coalesceKey?: string): T;
  rollbackBatch(): void;
  clear(): void;
  get isBatching(): boolean;
  get canUndo(): boolean;
  get canRedo(): boolean;
  get undoLabel(): string | null;
  get redoLabel(): string | null;
  private get currentBatch();
  private createBatchEntry;
  private pushUndoEntry;
  private trimUndoStack;
}
//#endregion
export { UndoEntry, UndoManager, UndoManagerOptions };
//# sourceMappingURL=undo2.d.ts.map