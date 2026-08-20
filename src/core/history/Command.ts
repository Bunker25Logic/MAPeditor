/**
 * src/core/history/Command.ts
 * Interface definition for the Command pattern in the Map Editor.
 */

export interface Command {
  readonly description?: string;
  execute(): void;
  undo(): void;
  redo?(): void;
}
