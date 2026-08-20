/**
 * Map.js
 * Core Map data model for the MMO 2D RPG Editor.
 * Maintains clean separation between:
 *  - TERRAIN (tile grid matrix + chunk layout)
 *  - OBJECTS (free-coordinate spatial entities with anchors and collision)
 */

export class GameMap {
  constructor(options = {}) {
    this.version = 1;
    this.tileSize = options.tileSize || 32;
    this.chunkSize = options.chunkSize || 32; // 32x32 tiles per chunk
    this.width = options.width || 64;   // in tiles (64 * 32 = 2048px)
    this.height = options.height || 64; // in tiles
    this.defaultTerrain = options.defaultTerrain || 'grass';

    // 2D matrix of terrain tiles: terrain[y][x] = "grass"
    this.terrain = [];
    // Array of placed objects
    this.objects = [];

    this.initTerrain(this.defaultTerrain);
  }

  /**
   * Initializes or resets the entire terrain matrix
   */
  initTerrain(fillTile = 'grass') {
    this.defaultTerrain = fillTile;
    this.terrain = [];
    for (let y = 0; y < this.height; y++) {
      const row = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        row[x] = fillTile;
      }
      this.terrain.push(row);
    }
  }

  /**
   * Safe boundary check
   */
  isInBounds(tx, ty) {
    return tx >= 0 && tx < this.width && ty >= 0 && ty < this.height;
  }

  getTile(tx, ty) {
    if (!this.isInBounds(tx, ty)) return null;
    return this.terrain[ty][tx];
  }

  setTile(tx, ty, tileId) {
    if (!this.isInBounds(tx, ty)) return false;
    if (this.terrain[ty][tx] === tileId) return false;
    this.terrain[ty][tx] = tileId;
    return true;
  }

  fillTerrain(tileId) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.terrain[y][x] = tileId;
      }
    }
  }

  /**
   * Flood Fill (Bucket tool) for continuous regions
   */
  floodFill(startX, startY, targetTile) {
    if (!this.isInBounds(startX, startY)) return [];
    const sourceTile = this.terrain[startY][startX];
    if (sourceTile === targetTile) return [];

    const changed = [];
    const queue = [[startX, startY]];
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;

    visited.add(key(startX, startY));

    while (queue.length > 0) {
      const [cx, cy] = queue.pop();
      this.terrain[cy][cx] = targetTile;
      changed.push({ x: cx, y: cy, prev: sourceTile, next: targetTile });

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (this.isInBounds(nx, ny)) {
          const k = key(nx, ny);
          if (!visited.has(k) && this.terrain[ny][nx] === sourceTile) {
            visited.add(k);
            queue.push([nx, ny]);
          }
        }
      }
    }

    return changed;
  }

  /* =========================================================================
     OBJECT MANAGEMENT
     ========================================================================= */

  addObject(objData) {
    const id = objData.id || `obj_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const obj = {
      id,
      asset: objData.asset,
      x: objData.x !== undefined ? objData.x : 0,
      y: objData.y !== undefined ? objData.y : 0,
      scaleX: objData.scaleX !== undefined ? objData.scaleX : 1,
      scaleY: objData.scaleY !== undefined ? objData.scaleY : 1,
      rotation: objData.rotation !== undefined ? objData.rotation : 0,
      anchorX: objData.anchorX !== undefined ? objData.anchorX : 0.5,
      anchorY: objData.anchorY !== undefined ? objData.anchorY : 1.0,
      collision: objData.collision !== undefined ? objData.collision : true,
      collisionBox: objData.collisionBox ? { ...objData.collisionBox } : null,
      customProps: objData.customProps ? { ...objData.customProps } : {}
    };

    this.objects.push(obj);
    return obj;
  }

  removeObject(id) {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx !== -1) {
      const removed = this.objects.splice(idx, 1)[0];
      return removed;
    }
    return null;
  }

  getObject(id) {
    return this.objects.find(o => o.id === id) || null;
  }

  updateObject(id, partialData) {
    const obj = this.getObject(id);
    if (!obj) return null;
    Object.assign(obj, partialData);
    return obj;
  }

  clearObjects() {
    this.objects = [];
  }

  /**
   * Finds the topmost object at world coordinates (wx, wy) based on visual bounding/hitbox
   */
  findObjectAt(wx, wy, assetManager) {
    // Traverse from highest depth / newest to find clicked object
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      const def = assetManager.getObjectDef(obj.asset);
      if (!def) continue;

      const w = def.width * Math.abs(obj.scaleX);
      const h = def.height * Math.abs(obj.scaleY);
      
      const left = obj.x - w * obj.anchorX;
      const top = obj.y - h * obj.anchorY;
      const right = left + w;
      const bottom = top + h;

      if (wx >= left && wx <= right && wy >= top && wy <= bottom) {
        return obj;
      }
    }
    return null;
  }

  /* =========================================================================
     COORDINATE / CHUNK CONVERSIONS
     ========================================================================= */

  worldToTile(wx, wy) {
    return {
      tx: Math.floor(wx / this.tileSize),
      ty: Math.floor(wy / this.tileSize)
    };
  }

  tileToWorld(tx, ty) {
    return {
      wx: tx * this.tileSize,
      wy: ty * this.tileSize
    };
  }

  tileToChunk(tx, ty) {
    return {
      chunkX: Math.floor(tx / this.chunkSize),
      chunkY: Math.floor(ty / this.chunkSize)
    };
  }

  worldToChunk(wx, wy) {
    const { tx, ty } = this.worldToTile(wx, wy);
    return this.tileToChunk(tx, ty);
  }

  getChunkCount() {
    return {
      chunksX: Math.ceil(this.width / this.chunkSize),
      chunksY: Math.ceil(this.height / this.chunkSize)
    };
  }

  /**
   * Calculates world bounds for a specific chunk
   */
  getChunkWorldBounds(chunkX, chunkY) {
    const chunkPx = this.chunkSize * this.tileSize;
    const minX = chunkX * chunkPx;
    const minY = chunkY * chunkPx;
    return {
      minX,
      minY,
      maxX: Math.min(minX + chunkPx, this.getWorldWidth()),
      maxY: Math.min(minY + chunkPx, this.getWorldHeight())
    };
  }

  /**
   * Returns list of visible chunks that intersect with viewBounds
   * @param {{ minX: number, minY: number, maxX: number, maxY: number }} viewBounds
   * @returns {Array<{ chunkX: number, chunkY: number, key: string, bounds: object }>}
   */
  getVisibleChunks(viewBounds) {
    if (!viewBounds) {
      const allChunks = [];
      const { chunksX, chunksY } = this.getChunkCount();
      for (let cy = 0; cy < chunksY; cy++) {
        for (let cx = 0; cx < chunksX; cx++) {
          allChunks.push({
            chunkX: cx,
            chunkY: cy,
            key: `${cx},${cy}`,
            bounds: this.getChunkWorldBounds(cx, cy)
          });
        }
      }
      return allChunks;
    }

    const { chunksX, chunksY } = this.getChunkCount();
    const chunkPx = this.chunkSize * this.tileSize;

    const minChunkX = Math.max(0, Math.floor(viewBounds.minX / chunkPx));
    const maxChunkX = Math.min(chunksX - 1, Math.floor(viewBounds.maxX / chunkPx));
    const minChunkY = Math.max(0, Math.floor(viewBounds.minY / chunkPx));
    const maxChunkY = Math.min(chunksY - 1, Math.floor(viewBounds.maxY / chunkPx));

    const visibleChunks = [];
    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        visibleChunks.push({
          chunkX: cx,
          chunkY: cy,
          key: `${cx},${cy}`,
          bounds: this.getChunkWorldBounds(cx, cy)
        });
      }
    }

    return visibleChunks;
  }

  /**
   * Calculates the axis-aligned visual bounding box (AABB) of an object in world coordinates
   */
  getObjectBounds(obj, assetManager) {
    const def = assetManager ? assetManager.getObjectDef(obj.asset) : null;
    const w = (def ? def.width : 32) * Math.abs(obj.scaleX !== undefined ? obj.scaleX : 1);
    const h = (def ? def.height : 32) * Math.abs(obj.scaleY !== undefined ? obj.scaleY : 1);
    const anchorX = obj.anchorX !== undefined ? obj.anchorX : 0.5;
    const anchorY = obj.anchorY !== undefined ? obj.anchorY : 1.0;

    // Fast approximate bounding box with rotation expansion
    if (obj.rotation && Math.abs(obj.rotation) > 0.01) {
      const cos = Math.abs(Math.cos(obj.rotation));
      const sin = Math.abs(Math.sin(obj.rotation));
      const bbW = w * cos + h * sin;
      const bbH = w * sin + h * cos;
      const radius = Math.max(bbW, bbH);
      return {
        minX: obj.x - radius,
        maxX: obj.x + radius,
        minY: obj.y - radius,
        maxY: obj.y + radius,
        w: bbW,
        h: bbH
      };
    }

    const minX = obj.x - w * anchorX;
    const maxX = minX + w;
    const minY = obj.y - h * anchorY;
    const maxY = minY + h;

    return { minX, maxX, minY, maxY, w, h };
  }

  /**
   * Checks if an object's bounding box intersects the given view bounds
   */
  isObjectInBounds(obj, viewBounds, assetManager) {
    if (!viewBounds) return true;
    const bounds = this.getObjectBounds(obj, assetManager);
    return !(
      bounds.maxX < viewBounds.minX ||
      bounds.minX > viewBounds.maxX ||
      bounds.maxY < viewBounds.minY ||
      bounds.minY > viewBounds.maxY
    );
  }

  /**
   * Queries and returns all objects within the view bounds
   */
  getVisibleObjects(viewBounds, assetManager) {
    if (!viewBounds) return this.objects;
    const visible = [];
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (this.isObjectInBounds(obj, viewBounds, assetManager)) {
        visible.push(obj);
      }
    }
    return visible;
  }

  /**
   * Resizes map preserving existing tiles and objects
   */
  resize(newWidth, newHeight, fillTile = 'grass') {
    const oldTerrain = this.terrain;
    const oldW = this.width;
    const oldH = this.height;

    this.width = newWidth;
    this.height = newHeight;
    this.terrain = [];

    for (let y = 0; y < newHeight; y++) {
      const row = new Array(newWidth);
      for (let x = 0; x < newWidth; x++) {
        if (y < oldH && x < oldW) {
          row[x] = oldTerrain[y][x];
        } else {
          row[x] = fillTile;
        }
      }
      this.terrain.push(row);
    }
  }

  getWorldWidth() {
    return this.width * this.tileSize;
  }

  getWorldHeight() {
    return this.height * this.tileSize;
  }
}
