/**
 * src/core/history/History.ts
 * Manages the undo/redo stacks of Commands and tracks dirty state relative to saves.
 */

import { Command } from './Command';

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;
  private savedStepId: number = 0;
  private currentStepId: number = 0;
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
    this.currentStepId++;
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.notify();
  }

  /**
   * Directly pushes an already executed command to the undo stack.
   */
  push(command: Command): void {
    this.currentStepId++;
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
    this.currentStepId--;
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
    this.currentStepId++;
    this.undoStack.push(cmd);
    this.notify();
    return true;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.savedStepId = 0;
    this.currentStepId = 0;
    this.notify();
  }

  markSaved(): void {
    this.savedStepId = this.currentStepId;
    this.notify();
  }

  isDirty(): boolean {
    return this.currentStepId !== this.savedStepId;
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
