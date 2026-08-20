/**
 * src/core/map/GameMap.ts
 * Core GameMap implementation completely independent of PixiJS and DOM.
 * Holds terrain, objects, and collision data with pure spatial math.
 */

import { MapObject, MapData, ObjectDefinition } from '../types';
import { IdGenerator } from '../IdGenerator';
import { Transform } from '../Transform';

export interface GameMapOptions {
  width?: number;
  height?: number;
  tileSize?: number;
  chunkSize?: number;
  defaultTerrain?: string;
}

export class GameMap {
  public version = 1;
  public width: number;
  public height: number;
  public tileSize: number;
  public chunkSize: number;

  public terrain: (string | null)[][];
  public objects: MapObject[];
  public collision: number[][];
  public metadata: Record<string, unknown>;

  constructor(options: GameMapOptions = {}) {
    this.width = options.width || 64;
    this.height = options.height || 64;
    this.tileSize = options.tileSize || 32;
    this.chunkSize = options.chunkSize || 16;
    this.metadata = { name: 'New Map', createdAt: new Date().toISOString() };

    this.terrain = [];
    this.objects = [];
    this.collision = [];

    this.initTerrain(options.defaultTerrain || 'grass');
    this.initCollision();
  }

  initTerrain(defaultTerrain: string): void {
    this.terrain = [];
    for (let y = 0; y < this.height; y++) {
      const row: (string | null)[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(defaultTerrain);
      }
      this.terrain.push(row);
    }
  }

  initCollision(): void {
    this.collision = [];
    for (let y = 0; y < this.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(0);
      }
      this.collision.push(row);
    }
  }

  worldToTile(wx: number, wy: number): { tx: number; ty: number } {
    return {
      tx: Math.floor(wx / this.tileSize),
      ty: Math.floor(wy / this.tileSize)
    };
  }

  tileToWorld(tx: number, ty: number): { wx: number; wy: number } {
    return {
      wx: tx * this.tileSize,
      wy: ty * this.tileSize
    };
  }

  inBounds(tx: number, ty: number): boolean {
    return tx >= 0 && tx < this.width && ty >= 0 && ty < this.height;
  }

  getTile(tx: number, ty: number): string | null {
    if (!this.inBounds(tx, ty)) return null;
    return this.terrain[ty][tx];
  }

  setTile(tx: number, ty: number, terrainId: string | null): boolean {
    if (!this.inBounds(tx, ty)) return false;
    if (this.terrain[ty][tx] === terrainId) return false;
    this.terrain[ty][tx] = terrainId;
    return true;
  }

  setTiles(tiles: Array<{ tx: number; ty: number; terrainId: string | null }>): Array<{ tx: number; ty: number; oldId: string | null; newId: string | null }> {
    const changes: Array<{ tx: number; ty: number; oldId: string | null; newId: string | null }> = [];
    for (const { tx, ty, terrainId } of tiles) {
      if (this.inBounds(tx, ty)) {
        const oldId = this.terrain[ty][tx];
        if (oldId !== terrainId) {
          this.terrain[ty][tx] = terrainId;
          changes.push({ tx, ty, oldId, newId: terrainId });
        }
      }
    }
    return changes;
  }

  getCollision(tx: number, ty: number): number {
    if (!this.inBounds(tx, ty)) return 1;
    return this.collision[ty][tx];
  }

  setCollision(tx: number, ty: number, val: number): boolean {
    if (!this.inBounds(tx, ty)) return false;
    this.collision[ty][tx] = val ? 1 : 0;
    return true;
  }

  addObject(objData: Partial<MapObject> & { asset: string }): MapObject {
    const id = objData.id || IdGenerator.generate('obj');
    const obj: MapObject = {
      id,
      asset: objData.asset,
      x: typeof objData.x === 'number' && Number.isFinite(objData.x) ? objData.x : 0,
      y: typeof objData.y === 'number' && Number.isFinite(objData.y) ? objData.y : 0,
      scaleX: typeof objData.scaleX === 'number' && Number.isFinite(objData.scaleX) ? objData.scaleX : 1,
      scaleY: typeof objData.scaleY === 'number' && Number.isFinite(objData.scaleY) ? objData.scaleY : 1,
      rotation: typeof objData.rotation === 'number' && Number.isFinite(objData.rotation) ? objData.rotation : 0,
      anchorX: typeof objData.anchorX === 'number' && Number.isFinite(objData.anchorX) ? objData.anchorX : 0.5,
      anchorY: typeof objData.anchorY === 'number' && Number.isFinite(objData.anchorY) ? objData.anchorY : 1.0,
      collision: objData.collision !== undefined ? Boolean(objData.collision) : true,
      collisionBox: objData.collisionBox ? { ...objData.collisionBox } : null,
      customProps: objData.customProps ? { ...objData.customProps } : {}
    };

    this.objects.push(obj);
    return obj;
  }

  removeObject(id: string): MapObject | null {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx !== -1) {
      return this.objects.splice(idx, 1)[0];
    }
    return null;
  }

  getObject(id: string): MapObject | null {
    return this.objects.find(o => o.id === id) || null;
  }

  updateObject(id: string, updates: Partial<MapObject>): MapObject | null {
    const obj = this.getObject(id);
    if (!obj) return null;

    if (updates.x !== undefined && Number.isFinite(updates.x)) obj.x = updates.x;
    if (updates.y !== undefined && Number.isFinite(updates.y)) obj.y = updates.y;
    if (updates.scaleX !== undefined && Number.isFinite(updates.scaleX)) obj.scaleX = updates.scaleX;
    if (updates.scaleY !== undefined && Number.isFinite(updates.scaleY)) obj.scaleY = updates.scaleY;
    if (updates.rotation !== undefined && Number.isFinite(updates.rotation)) obj.rotation = updates.rotation;
    if (updates.anchorX !== undefined && Number.isFinite(updates.anchorX)) obj.anchorX = updates.anchorX;
    if (updates.anchorY !== undefined && Number.isFinite(updates.anchorY)) obj.anchorY = updates.anchorY;
    if (updates.collision !== undefined) obj.collision = Boolean(updates.collision);
    if (updates.customProps) obj.customProps = { ...obj.customProps, ...updates.customProps };

    return obj;
  }

  findObjectAt(
    wx: number,
    wy: number,
    getAssetDef: (assetId: string) => ObjectDefinition | null
  ): MapObject | null {
    // Check from newest (topmost) to oldest
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      const def = getAssetDef(obj.asset);
      if (!def) continue;

      const isHit = Transform.hitTest(wx, wy, def.width, def.height, obj);
      if (isHit) return obj;
    }
    return null;
  }

  /**
   * Checks if a circular entity at (x, y) with radius intersects any collision tile
   */
  checkTileCollision(x: number, y: number, radius = 9): boolean {
    const minTx = Math.floor((x - radius) / this.tileSize);
    const maxTx = Math.floor((x + radius) / this.tileSize);
    const minTy = Math.floor((y - radius) / this.tileSize);
    const maxTy = Math.floor((y + radius) / this.tileSize);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (!this.inBounds(tx, ty) || this.getCollision(tx, ty) === 1) {
          const tileLeft = tx * this.tileSize;
          const tileTop = ty * this.tileSize;
          const tileRight = tileLeft + this.tileSize;
          const tileBottom = tileTop + this.tileSize;

          const closestX = Math.max(tileLeft, Math.min(x, tileRight));
          const closestY = Math.max(tileTop, Math.min(y, tileBottom));
          const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;

          if (distSq < radius * radius) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Checks if a circular entity at (x, y) with radius intersects any object's collisionBox
   */
  checkObjectCollision(
    x: number,
    y: number,
    radius = 9,
    getAssetDef: (assetId: string) => ObjectDefinition | null
  ): boolean {
    for (const obj of this.objects) {
      if (obj.collision === false) continue;

      const def = getAssetDef(obj.asset);
      const colBox = obj.collisionBox || def?.collisionBox;
      if (!colBox) continue;

      // Transform world coordinate (x, y) into object's local coordinate space
      const { localX, localY } = Transform.worldToLocal(x, y, obj);

      const halfW = colBox.width / 2;
      const halfH = colBox.height / 2;
      const minX = colBox.offsetX - halfW;
      const maxX = colBox.offsetX + halfW;
      const minY = colBox.offsetY - halfH;
      const maxY = colBox.offsetY + halfH;

      const closestX = Math.max(minX, Math.min(localX, maxX));
      const closestY = Math.max(minY, Math.min(localY, maxY));

      const scale = Math.max(0.1, Math.abs(obj.scaleX || 1), Math.abs(obj.scaleY || 1));
      const effRadius = radius / scale;

      const distSq = (localX - closestX) ** 2 + (localY - closestY) ** 2;
      if (distSq < effRadius * effRadius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks combined tile + object collision
   */
  checkCollision(
    x: number,
    y: number,
    radius = 9,
    getAssetDef: (assetId: string) => ObjectDefinition | null
  ): boolean {
    // Check map boundary
    if (
      x < radius ||
      x > this.width * this.tileSize - radius ||
      y < radius ||
      y > this.height * this.tileSize - radius
    ) {
      return true;
    }

    if (this.checkTileCollision(x, y, radius)) return true;
    if (this.checkObjectCollision(x, y, radius, getAssetDef)) return true;

    return false;
  }

  /**
   * Calculates player movement with sliding along collision boundaries
   */
  movePlayerWithCollision(
    curX: number,
    curY: number,
    dx: number,
    dy: number,
    radius = 9,
    getAssetDef: (assetId: string) => ObjectDefinition | null
  ): { x: number; y: number } {
    const targetX = curX + dx;
    const targetY = curY + dy;

    // 1. Try moving full diagonal / direct step
    if (!this.checkCollision(targetX, targetY, radius, getAssetDef)) {
      return { x: targetX, y: targetY };
    }

    // 2. Try moving along X axis only (sliding)
    if (dx !== 0 && !this.checkCollision(targetX, curY, radius, getAssetDef)) {
      return { x: targetX, y: curY };
    }

    // 3. Try moving along Y axis only (sliding)
    if (dy !== 0 && !this.checkCollision(curX, targetY, radius, getAssetDef)) {
      return { x: curX, y: targetY };
    }

    // 4. Blocked completely
    return { x: curX, y: curY };
  }

  /**
   * Pure calculation of flood fill changes without mutating internal state.
   * Returns list of changes ready for PaintTilesCommand.
   */
  calculateFloodFill(
    startTx: number,
    startTy: number,
    targetTerrain: string,
    maxSteps = 65536
  ): Array<{ tx: number; ty: number; oldId: string | null; newId: string }> {
    if (!this.inBounds(startTx, startTy)) return [];
    const initialTerrain = this.terrain[startTy][startTx];
    if (initialTerrain === targetTerrain) return [];

    const changes: Array<{ tx: number; ty: number; oldId: string | null; newId: string }> = [];
    const visited = new Uint8Array(this.width * this.height);
    const queue: Array<[number, number]> = [[startTx, startTy]];

    let steps = 0;
    while (queue.length > 0 && steps < maxSteps) {
      steps++;
      const [cx, cy] = queue.pop()!;
      const idx = cy * this.width + cx;

      if (visited[idx]) continue;
      visited[idx] = 1;

      if (this.terrain[cy][cx] === initialTerrain) {
        changes.push({ tx: cx, ty: cy, oldId: initialTerrain, newId: targetTerrain });

        if (cx > 0 && !visited[cy * this.width + (cx - 1)]) queue.push([cx - 1, cy]);
        if (cx < this.width - 1 && !visited[cy * this.width + (cx + 1)]) queue.push([cx + 1, cy]);
        if (cy > 0 && !visited[(cy - 1) * this.width + cx]) queue.push([cx, cy - 1]);
        if (cy < this.height - 1 && !visited[(cy + 1) * this.width + cx]) queue.push([cx, cy + 1]);
      }
    }

    return changes;
  }

  /**
   * Pure calculation of filling all map tiles with a specific terrain without mutating state.
   */
  calculateFillAll(targetTerrain: string): Array<{ tx: number; ty: number; oldId: string | null; newId: string }> {
    const changes: Array<{ tx: number; ty: number; oldId: string | null; newId: string }> = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const oldId = this.terrain[y][x];
        if (oldId !== targetTerrain) {
          changes.push({ tx: x, ty: y, oldId, newId: targetTerrain });
        }
      }
    }
    return changes;
  }

  floodFill(
    startTx: number,
    startTy: number,
    targetTerrain: string,
    maxSteps = 65536
  ): Array<{ tx: number; ty: number; oldId: string | null; newId: string }> {
    const changes = this.calculateFloodFill(startTx, startTy, targetTerrain, maxSteps);
    for (const c of changes) {
      this.terrain[c.ty][c.tx] = c.newId;
    }
    return changes;
  }

  resize(newWidth: number, newHeight: number, defaultTerrain = 'grass'): void {
    const clampedW = Math.max(16, Math.min(512, newWidth));
    const clampedH = Math.max(16, Math.min(512, newHeight));

    const newTerrain: (string | null)[][] = [];
    const newCollision: number[][] = [];

    for (let y = 0; y < clampedH; y++) {
      const terrainRow: (string | null)[] = [];
      const colRow: number[] = [];
      for (let x = 0; x < clampedW; x++) {
        if (y < this.height && x < this.width) {
          terrainRow.push(this.terrain[y][x]);
          colRow.push(this.collision[y][x]);
        } else {
          terrainRow.push(defaultTerrain);
          colRow.push(0);
        }
      }
      newTerrain.push(terrainRow);
      newCollision.push(colRow);
    }

    this.width = clampedW;
    this.height = clampedH;
    this.terrain = newTerrain;
    this.collision = newCollision;
  }

  toJSON(): MapData {
    return {
      format: 'bunker25-map',
      version: this.version,
      editorVersion: '1.0.0',
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      chunkSize: this.chunkSize,
      terrain: this.terrain,
      objects: this.objects.map(o => ({ ...o })),
      collision: this.collision,
      metadata: {
        ...this.metadata,
        modifiedAt: new Date().toISOString()
      }
    };
  }
}
