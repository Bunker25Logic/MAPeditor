/**
 * src/core/history/History.ts
 * Manages the undo/redo stacks of Commands.
 */

import { Command } from './Command';

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;
  public onStateChange?: () => void;

  constructor(maxHistory = 50, onStateChange?: () => void) {
    this.maxHistory = maxHistory;
    this.onStateChange = onStateChange;
  }

  setOnStateChange(cb: () => void): void {
    this.onStateChange = cb;
  }

  /**
   * Executes a command and adds it to the undo stack.
   * Clears the redo stack.
   */
  execute(command: Command): void {
    command.execute();
    this.push(command);
  }

  /**
   * Directly pushes an already executed command to the undo stack.
   */
  push(command: Command): void {
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;

    cmd.undo();
    this.redoStack.push(cmd);
    this.notify();
    return true;
  }

  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;

    if (cmd.redo) {
      cmd.redo();
    } else {
      cmd.execute();
    }
    this.undoStack.push(cmd);
    this.notify();
    return true;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private notify(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
