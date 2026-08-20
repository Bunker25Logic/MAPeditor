/**
 * TerrainLayer.js
 * Optimized PixiJS rendering layer for the 2D tile grid.
 * Uses a Chunk-based structure (32x32 tiles per chunk) with batch sprite rendering
 * so huge MMO maps remain lightweight, performant and modular.
 */

import * as PIXI from 'pixi.js';

export class TerrainLayer {
  constructor(map, assetManager) {
    this.map = map;
    this.assetManager = assetManager;

    // Root Pixi container for all terrain chunks
    this.container = new PIXI.Container();
    this.container.name = 'TerrainLayer';

    // Grid overlay graphics
    this.gridGraphics = new PIXI.Graphics();
    this.gridGraphics.name = 'GridOverlay';
    this.showGrid = true;

    // Chunk containers map: `chunkX,chunkY` -> { container, sprites: 2D array, dirty: boolean }
    this.chunks = new Map();

    // Viewport Culling state
    this.lastViewBounds = null;
    this.visibleChunksCount = 0;

    this.rebuildAll();
  }

  /**
   * Rebuilds all chunk containers and tiles
   */
  rebuildAll() {
    // Clear old chunk containers
    this.container.removeChildren();
    this.chunks.clear();

    const { chunksX, chunksY } = this.map.getChunkCount();
    const chunkSize = this.map.chunkSize;
    const tileSize = this.map.tileSize;

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const chunkContainer = new PIXI.Container();
        chunkContainer.position.set(cx * chunkSize * tileSize, cy * chunkSize * tileSize);

        // Preallocate sprite references for fast texture swapping
        const sprites = [];
        const startX = cx * chunkSize;
        const startY = cy * chunkSize;
        const endX = Math.min(startX + chunkSize, this.map.width);
        const endY = Math.min(startY + chunkSize, this.map.height);

        for (let y = startY; y < endY; y++) {
          const localY = y - startY;
          if (!sprites[localY]) sprites[localY] = [];

          for (let x = startX; x < endX; x++) {
            const localX = x - startX;
            const tileId = this.map.getTile(x, y) || 'grass';
            const terrainDef = this.assetManager.getTerrain(tileId);

            const sprite = new PIXI.Sprite(terrainDef.texture);
            sprite.position.set(localX * tileSize, localY * tileSize);
            sprite.width = tileSize;
            sprite.height = tileSize;

            chunkContainer.addChild(sprite);
            sprites[localY][localX] = sprite;
          }
        }

        const chunkKey = `${cx},${cy}`;
        this.chunks.set(chunkKey, {
          container: chunkContainer,
          sprites,
          cx,
          cy,
          startX,
          startY,
          endX,
          endY
        });

        this.container.addChild(chunkContainer);
      }
    }

    // Add grid overlay on top of terrain
    this.container.addChild(this.gridGraphics);
    this.renderGrid();

    // Re-apply viewport culling if camera bounds exist
    if (this.lastViewBounds) {
      this.cull(this.lastViewBounds);
    }
  }

  /**
   * Performs frustum / viewport culling on terrain chunks.
   * Chunks entirely outside the camera's viewport are marked non-renderable,
   * bypassing PixiJS WebGL draw loops and matrix transformations.
   * @param {{ minX: number, minY: number, maxX: number, maxY: number } | null} viewBounds
   */
  cull(viewBounds) {
    this.lastViewBounds = viewBounds;

    if (!viewBounds) {
      this.chunks.forEach(chunk => {
        chunk.container.visible = true;
        chunk.container.renderable = true;
      });
      this.visibleChunksCount = this.chunks.size;
      return;
    }

    const visibleChunkList = this.map.getVisibleChunks(viewBounds);
    const visibleChunkKeys = new Set(visibleChunkList.map(c => c.key));

    let visibleCount = 0;
    this.chunks.forEach((chunk, key) => {
      const isVisible = visibleChunkKeys.has(key);
      chunk.container.visible = isVisible;
      chunk.container.renderable = isVisible;
      if (isVisible) {
        visibleCount++;
      }
    });

    this.visibleChunksCount = visibleCount;
  }

  /**
   * Updates only a specific tile's sprite texture instantly without recreating chunks
   */
  updateTile(tx, ty, tileId) {
    const { chunkX, chunkY } = this.map.tileToChunk(tx, ty);
    const chunkKey = `${chunkX},${chunkY}`;
    const chunk = this.chunks.get(chunkKey);
    if (!chunk) return;

    const localX = tx - chunk.startX;
    const localY = ty - chunk.startY;

    if (chunk.sprites[localY] && chunk.sprites[localY][localX]) {
      const terrainDef = this.assetManager.getTerrain(tileId);
      chunk.sprites[localY][localX].texture = terrainDef.texture;
    }
  }

  /**
   * Updates a list of modified tiles
   */
  updateTiles(tileList) {
    for (const { x, y, next } of tileList) {
      this.updateTile(x, y, next);
    }
  }

  /**
   * Toggles grid visibility
   */
  setGridVisible(visible) {
    this.showGrid = visible;
    this.gridGraphics.visible = visible;
  }

  /**
   * Renders the tile grid lines and prominent chunk boundary lines
   */
  renderGrid() {
    this.gridGraphics.clear();
    if (!this.showGrid) return;

    const w = this.map.getWorldWidth();
    const h = this.map.getWorldHeight();
    const ts = this.map.tileSize;
    const cs = this.map.chunkSize * ts; // chunk size in pixels

    // Subtle 32px Tile Grid
    this.gridGraphics.lineStyle(1, 0xffffff, 0.12);

    for (let x = 0; x <= w; x += ts) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, h);
    }

    for (let y = 0; y <= h; y += ts) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(w, y);
    }

    // Prominent Chunk Boundaries (Golden / Cyan highlighted borders every 32 tiles)
    this.gridGraphics.lineStyle(2, 0x38bdf8, 0.45);

    for (let x = 0; x <= w; x += cs) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, h);
    }

    for (let y = 0; y <= h; y += cs) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(w, y);
    }

    // Outer Map Border
    this.gridGraphics.lineStyle(3, 0x4f8cff, 0.8);
    this.gridGraphics.drawRect(0, 0, w, h);
  }
}
