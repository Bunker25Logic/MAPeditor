/**
 * src/rendering/Renderer.ts
 * Abstract interface definition for the map rendering layer.
 */

import { GameMap } from '../core/map/GameMap';
import { EditorStateModel, ObjectDefinition } from '../core/types';
import { Camera } from './Camera';

export interface Renderer {
  readonly camera: Camera;

  init(container: HTMLElement): Promise<void>;
  resize(width: number, height: number): void;
  render(map: GameMap, state: Readonly<EditorStateModel>): void;
  scheduleRender(map: GameMap, state: Readonly<EditorStateModel>): void;
  destroy(): void;

  // Layer specific updates
  invalidateTerrain(): void;
  invalidateObjects(): void;
  invalidateGrid(): void;
  invalidateCollision(): void;

  getObjectDef(assetId: string): ObjectDefinition | null;
}
