/**
 * src/core/history/commands/PaintTilesCommand.ts
 * Command for batch tile painting, fills, and flood fills.
 */

import { Command } from '../Command';
import { GameMap } from '../../map/GameMap';

export interface TileChange {
  tx: number;
  ty: number;
  oldId: string | null;
  newId: string | null;
}

export class PaintTilesCommand implements Command {
  readonly description: string;
  private map: GameMap;
  private changes: TileChange[];
  private onApply?: (changes: TileChange[]) => void;

  constructor(
    map: GameMap,
    changes: TileChange[],
    description = 'Paint Tiles',
    onApply?: (changes: TileChange[]) => void
  ) {
    this.map = map;
    this.changes = changes;
    this.description = description;
    this.onApply = onApply;
  }

  execute(): void {
    const applied: TileChange[] = [];
    for (const c of this.changes) {
      this.map.setTile(c.tx, c.ty, c.newId);
      applied.push(c);
    }
    if (this.onApply) this.onApply(applied);
  }

  undo(): void {
    const reverted: TileChange[] = [];
    for (const c of this.changes) {
      this.map.setTile(c.tx, c.ty, c.oldId);
      reverted.push({ tx: c.tx, ty: c.ty, oldId: c.newId, newId: c.oldId });
    }
    if (this.onApply) this.onApply(reverted);
  }

  redo(): void {
    this.execute();
  }
}
