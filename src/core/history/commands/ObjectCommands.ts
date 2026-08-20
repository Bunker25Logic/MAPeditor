/**
 * src/core/history/commands/ObjectCommands.ts
 * Commands for adding, removing, transforming, batch adding, and clearing map objects.
 */

import { Command } from '../Command';
import { GameMap } from '../../map/GameMap';
import { MapObject } from '../../types';
import { IdGenerator } from '../../IdGenerator';

export class AddObjectCommand implements Command {
  readonly description: string;
  private map: GameMap;
  private objectData: MapObject;
  private onAdd?: (obj: MapObject) => void;
  private onRemove?: (id: string) => void;

  constructor(
    map: GameMap,
    objectData: Partial<MapObject> & { asset: string },
    description = 'Add Object',
    onAdd?: (obj: MapObject) => void,
    onRemove?: (id: string) => void
  ) {
    this.map = map;
    this.description = description;
    this.objectData = {
      id: objectData.id || IdGenerator.generate('obj'),
      asset: objectData.asset,
      x: objectData.x ?? 0,
      y: objectData.y ?? 0,
      scaleX: objectData.scaleX ?? 1,
      scaleY: objectData.scaleY ?? 1,
      rotation: objectData.rotation ?? 0,
      anchorX: objectData.anchorX ?? 0.5,
      anchorY: objectData.anchorY ?? 1.0,
      collision: objectData.collision ?? true,
      collisionBox: objectData.collisionBox ? { ...objectData.collisionBox } : null,
      customProps: objectData.customProps ? { ...objectData.customProps } : {}
    };
    this.onAdd = onAdd;
    this.onRemove = onRemove;
  }

  get createdObject(): MapObject {
    return this.objectData;
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

export class BatchAddObjectsCommand implements Command {
  readonly description: string;
  private map: GameMap;
  private objects: MapObject[];

  constructor(
    map: GameMap,
    objectsData: Array<Partial<MapObject> & { asset: string }>,
    description = 'Add Objects'
  ) {
    this.map = map;
    this.description = description;
    this.objects = objectsData.map(data => ({
      id: data.id || IdGenerator.generate('obj'),
      asset: data.asset,
      x: data.x ?? 0,
      y: data.y ?? 0,
      scaleX: data.scaleX ?? 1,
      scaleY: data.scaleY ?? 1,
      rotation: data.rotation ?? 0,
      anchorX: data.anchorX ?? 0.5,
      anchorY: data.anchorY ?? 1.0,
      collision: data.collision ?? true,
      collisionBox: data.collisionBox ? { ...data.collisionBox } : null,
      customProps: data.customProps ? { ...data.customProps } : {}
    }));
  }

  execute(): void {
    for (const obj of this.objects) {
      this.map.addObject(obj);
    }
  }

  undo(): void {
    for (const obj of this.objects) {
      this.map.removeObject(obj.id);
    }
  }

  redo(): void {
    this.execute();
  }
}

export class ClearObjectsCommand implements Command {
  readonly description = 'Clear All Objects';
  private map: GameMap;
  private removedObjects: MapObject[];

  constructor(map: GameMap) {
    this.map = map;
    this.removedObjects = map.objects.map(o => ({ ...o }));
  }

  execute(): void {
    for (const obj of this.removedObjects) {
      this.map.removeObject(obj.id);
    }
  }

  undo(): void {
    for (const obj of this.removedObjects) {
      this.map.addObject(obj);
    }
  }

  redo(): void {
    this.execute();
  }
}
