/**
 * src/core/history/commands/ResizeMapCommand.ts
 * Command to safely resize the map and revert cleanly.
 */

import { Command } from '../Command';
import { GameMap } from '../../map/GameMap';

export class ResizeMapCommand implements Command {
  readonly description = 'Resize Map';
  private map: GameMap;
  private oldWidth: number;
  private oldHeight: number;
  private oldTerrain: (string | null)[][];
  private oldCollision: number[][];
  private newWidth: number;
  private newHeight: number;
  private defaultTerrain: string;
  private onResize?: () => void;

  constructor(
    map: GameMap,
    newWidth: number,
    newHeight: number,
    defaultTerrain = 'grass',
    onResize?: () => void
  ) {
    this.map = map;
    this.oldWidth = map.width;
    this.oldHeight = map.height;
    this.oldTerrain = map.terrain.map(row => [...row]);
    this.oldCollision = map.collision.map(row => [...row]);
    this.newWidth = newWidth;
    this.newHeight = newHeight;
    this.defaultTerrain = defaultTerrain;
    this.onResize = onResize;
  }

  execute(): void {
    this.map.resize(this.newWidth, this.newHeight, this.defaultTerrain);
    if (this.onResize) this.onResize();
  }

  undo(): void {
    this.map.width = this.oldWidth;
    this.map.height = this.oldHeight;
    this.map.terrain = this.oldTerrain.map(row => [...row]);
    this.map.collision = this.oldCollision.map(row => [...row]);
    if (this.onResize) this.onResize();
  }

  redo(): void {
    this.execute();
  }
}
