/**
 * src/core/history/commands/ObjectCommands.ts
 * Commands for adding, removing, and transforming map objects.
 */

import { Command } from '../Command';
import { GameMap } from '../../map/GameMap';
import { MapObject } from '../../types';

export class AddObjectCommand implements Command {
  readonly description = 'Add Object';
  private map: GameMap;
  private objectData: MapObject;
  private onAdd?: (obj: MapObject) => void;
  private onRemove?: (id: string) => void;

  constructor(
    map: GameMap,
    objectData: MapObject,
    onAdd?: (obj: MapObject) => void,
    onRemove?: (id: string) => void
  ) {
    this.map = map;
    this.objectData = { ...objectData };
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  execute(): void {
    const created = this.map.addObject(this.objectData);
    if (this.onAdd) this.onAdd(created);
  }

  undo(): void {
    this.map.removeObject(this.objectData.id);
    if (this.onRemove) this.onRemove(this.objectData.id);
  }

  redo(): void {
    this.execute();
  }
}

export class RemoveObjectCommand implements Command {
  readonly description = 'Remove Object';
  private map: GameMap;
  private objectData: MapObject;
  private onAdd?: (obj: MapObject) => void;
  private onRemove?: (id: string) => void;

  constructor(
    map: GameMap,
    objectData: MapObject,
    onAdd?: (obj: MapObject) => void,
    onRemove?: (id: string) => void
  ) {
    this.map = map;
    this.objectData = { ...objectData };
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  execute(): void {
    this.map.removeObject(this.objectData.id);
    if (this.onRemove) this.onRemove(this.objectData.id);
  }

  undo(): void {
    const created = this.map.addObject(this.objectData);
    if (this.onAdd) this.onAdd(created);
  }

  redo(): void {
    this.execute();
  }
}

export class TransformObjectCommand implements Command {
  readonly description = 'Transform Object';
  private map: GameMap;
  private objectId: string;
  private oldState: Partial<MapObject>;
  private newState: Partial<MapObject>;
  private onUpdate?: (id: string, state: Partial<MapObject>) => void;

  constructor(
    map: GameMap,
    objectId: string,
    oldState: Partial<MapObject>,
    newState: Partial<MapObject>,
    onUpdate?: (id: string, state: Partial<MapObject>) => void
  ) {
    this.map = map;
    this.objectId = objectId;
    this.oldState = { ...oldState };
    this.newState = { ...newState };
    this.onUpdate = onUpdate;
  }

  execute(): void {
    this.map.updateObject(this.objectId, this.newState);
    if (this.onUpdate) this.onUpdate(this.objectId, this.newState);
  }

  undo(): void {
    this.map.updateObject(this.objectId, this.oldState);
    if (this.onUpdate) this.onUpdate(this.objectId, this.oldState);
  }

  redo(): void {
    this.execute();
  }
}
