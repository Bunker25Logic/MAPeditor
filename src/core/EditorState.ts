/**
 * src/core/EditorState.ts
 * Centralized, observable state for the 2D Map Editor.
 */

import { EditorStateModel, EditorTool, EditorLayer } from './types';

type StateListener = (state: Readonly<EditorStateModel>) => void;

export class EditorState {
  private state: EditorStateModel;
  private listeners: Set<StateListener> = new Set();

  constructor(initial?: Partial<EditorStateModel>) {
    this.state = {
      activeTool: 'select',
      activeLayer: 'terrain',
      selectedTerrainId: 'grass',
      selectedObjectId: null,
      selectedObjectAsset: 'tree_oak',
      brushSize: 1,
      gridVisible: true,
      collisionVisible: false,
      anchorsVisible: true,
      depthLinesVisible: true,
      playerMode: false,
      dirty: false,
      ...initial
    };
  }

  get current(): Readonly<EditorStateModel> {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const readonlyState = this.current;
    this.listeners.forEach(fn => fn(readonlyState));
  }

  set(partial: Partial<EditorStateModel>): void {
    let changed = false;
    for (const key of Object.keys(partial) as (keyof EditorStateModel)[]) {
      if (this.state[key] !== partial[key]) {
        (this.state as unknown as Record<string, unknown>)[key] = partial[key];
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  setTool(tool: EditorTool): void {
    this.set({ activeTool: tool });
  }

  setLayer(layer: EditorLayer): void {
    this.set({ activeLayer: layer });
  }

  setSelectedTerrain(terrainId: string): void {
    this.set({ selectedTerrainId: terrainId });
  }

  setSelectedObject(objectId: string | null): void {
    this.set({ selectedObjectId: objectId });
  }

  setSelectedAsset(assetId: string): void {
    this.set({ selectedObjectAsset: assetId });
  }

  setDirty(dirty: boolean): void {
    this.set({ dirty });
  }

  toggleGrid(): boolean {
    const next = !this.state.gridVisible;
    this.set({ gridVisible: next });
    return next;
  }

  toggleCollision(): boolean {
    const next = !this.state.collisionVisible;
    this.set({ collisionVisible: next });
    return next;
  }

  toggleAnchors(): boolean {
    const next = !this.state.anchorsVisible;
    this.set({ anchorsVisible: next });
    return next;
  }

  togglePlayerMode(): boolean {
    const next = !this.state.playerMode;
    this.set({ playerMode: next });
    return next;
  }
}
