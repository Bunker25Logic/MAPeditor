/**
 * src/rendering/PixiRenderer.ts
 * PixiJS implementation of the Renderer interface.
 * Decoupled from core GameMap and driven purely by State & Pure Map data.
 */

import * as PIXI from 'pixi.js';
import { Renderer } from './Renderer';
import { Camera } from './Camera';
import { DepthSorter } from './DepthSorter';
import { GameMap } from '../core/map/GameMap';
import { EditorStateModel, ObjectDefinition, MapObject } from '../core/types';
import { AssetManager } from '../../js/AssetManager.js';

export class PixiRenderer implements Renderer {
  public camera: Camera;
  public app: PIXI.Application | null = null;
  public assetManager: AssetManager;

  private rootContainer: PIXI.Container | null = null;
  private worldContainer: PIXI.Container | null = null;

  private terrainContainer: PIXI.Container | null = null;
  private gridGraphics: PIXI.Graphics | null = null;
  private objectsContainer: PIXI.Container | null = null;
  private gizmoGraphics: PIXI.Graphics | null = null;
  private collisionGraphics: PIXI.Graphics | null = null;
  private playerGraphics: PIXI.Graphics | null = null;

  // Object sprites cache { id: PIXI.Sprite }
  private objectSprites: Map<string, PIXI.Sprite> = new Map();

  // Terrain chunk rendering cache { `${cx}_${cy}`: PIXI.Container }
  private chunkContainers: Map<string, PIXI.Container> = new Map();

  private isTerrainDirty = true;
  private areObjectsDirty = true;
  private isGridDirty = true;
  private isCollisionDirty = true;

  constructor() {
    this.camera = new Camera(() => this.updateCameraTransform());
    this.assetManager = new AssetManager();
  }

  async init(containerEl: HTMLElement): Promise<void> {
    await this.assetManager.init();

    // If app already exists, remove canvas from previous container if needed
    if (this.app) {
      if (this.app.view && (this.app.view as unknown as HTMLElement).parentElement) {
        (this.app.view as unknown as HTMLElement).remove();
      }
    } else {
      this.app = new PIXI.Application({
        resizeTo: containerEl,
        backgroundColor: 0x14161d,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
    }

    const canvas = this.app.view as unknown as HTMLCanvasElement;
    if (canvas) {
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.pointerEvents = 'none'; // DOM pointer events handled by Viewport div
      if (!containerEl.contains(canvas)) {
        containerEl.appendChild(canvas);
      }
    }

    const width = containerEl.clientWidth || 800;
    const height = containerEl.clientHeight || 600;
    this.app.renderer.resize(width, height);
    this.camera.setViewportSize(width, height);

    // Containers hierarchy
    if (!this.rootContainer) {
      this.rootContainer = new PIXI.Container();
      this.worldContainer = new PIXI.Container();

      this.terrainContainer = new PIXI.Container();
      this.gridGraphics = new PIXI.Graphics();
      this.objectsContainer = new PIXI.Container();
      this.collisionGraphics = new PIXI.Graphics();
      this.gizmoGraphics = new PIXI.Graphics();
      this.playerGraphics = new PIXI.Graphics();

      this.worldContainer.addChild(this.terrainContainer);
      this.worldContainer.addChild(this.gridGraphics);
      this.worldContainer.addChild(this.objectsContainer);
      this.worldContainer.addChild(this.collisionGraphics);
      this.worldContainer.addChild(this.playerGraphics);
      this.worldContainer.addChild(this.gizmoGraphics);

      this.rootContainer.addChild(this.worldContainer);
      this.app.stage.addChild(this.rootContainer);
    }

    this.isTerrainDirty = true;
    this.areObjectsDirty = true;
    this.isGridDirty = true;
    this.isCollisionDirty = true;

    this.updateCameraTransform();
  }

  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);
      this.camera.setViewportSize(width, height);
      this.updateCameraTransform();
    }
  }

  getObjectDef(assetId: string): ObjectDefinition | null {
    return (this.assetManager.getObjectDef(assetId) as unknown as ObjectDefinition) || null;
  }

  invalidateTerrain(): void {
    this.isTerrainDirty = true;
  }

  invalidateObjects(): void {
    this.areObjectsDirty = true;
  }

  invalidateGrid(): void {
    this.isGridDirty = true;
  }

  invalidateCollision(): void {
    this.isCollisionDirty = true;
  }

  public updateCameraTransform(): void {
    if (!this.worldContainer) return;
    this.worldContainer.position.set(this.camera.x, this.camera.y);
    this.worldContainer.scale.set(this.camera.zoom, this.camera.zoom);
  }

  render(map: GameMap, state: Readonly<EditorStateModel>): void {
    if (!this.app || !this.worldContainer) return;

    this.updateCameraTransform();

    if (this.isTerrainDirty) {
      this.renderTerrain(map);
      this.isTerrainDirty = false;
    }

    if (this.isGridDirty) {
      this.renderGrid(map, state.gridVisible);
      this.isGridDirty = false;
    }

    if (this.areObjectsDirty) {
      this.renderObjects(map);
      this.areObjectsDirty = false;
    }

    if (this.isCollisionDirty) {
      this.renderCollision(map, state.collisionVisible);
      this.isCollisionDirty = false;
    }

    this.renderGizmo(map, state);
    this.app.render();
  }

  private renderTerrain(map: GameMap): void {
    if (!this.terrainContainer) return;

    // Clear chunk containers
    this.terrainContainer.removeChildren();
    this.chunkContainers.clear();

    const chunkSize = map.chunkSize || 16;
    const numChunksX = Math.ceil(map.width / chunkSize);
    const numChunksY = Math.ceil(map.height / chunkSize);

    for (let cy = 0; cy < numChunksY; cy++) {
      for (let cx = 0; cx < numChunksX; cx++) {
        const chunkCont = new PIXI.Container();
        const startX = cx * chunkSize;
        const startY = cy * chunkSize;
        const endX = Math.min(startX + chunkSize, map.width);
        const endY = Math.min(startY + chunkSize, map.height);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const tileId = map.getTile(x, y);
            if (!tileId) continue;

            const terrainDef = this.assetManager.getTerrain(tileId);
            if (!terrainDef || !terrainDef.texture) continue;

            const sprite = new PIXI.Sprite(terrainDef.texture);
            sprite.x = x * map.tileSize;
            sprite.y = y * map.tileSize;
            sprite.width = map.tileSize;
            sprite.height = map.tileSize;
            chunkCont.addChild(sprite);
          }
        }

        this.chunkContainers.set(`${cx}_${cy}`, chunkCont);
        this.terrainContainer.addChild(chunkCont);
      }
    }
  }

  private renderGrid(map: GameMap, visible: boolean): void {
    if (!this.gridGraphics) return;
    this.gridGraphics.clear();
    if (!visible) return;

    const totalWidth = map.width * map.tileSize;
    const totalHeight = map.height * map.tileSize;

    this.gridGraphics.lineStyle(1, 0xffffff, 0.08);

    for (let x = 0; x <= map.width; x++) {
      const px = x * map.tileSize;
      this.gridGraphics.moveTo(px, 0);
      this.gridGraphics.lineTo(px, totalHeight);
    }

    for (let y = 0; y <= map.height; y++) {
      const py = y * map.tileSize;
      this.gridGraphics.moveTo(0, py);
      this.gridGraphics.lineTo(totalWidth, py);
    }
  }

  private renderObjects(map: GameMap): void {
    if (!this.objectsContainer) return;

    // Sort objects by Depth and Category
    const sorted = DepthSorter.sortObjects(map.objects, id => this.getObjectDef(id));

    // Track active IDs to remove deleted ones
    const currentIds = new Set<string>();

    this.objectsContainer.removeChildren();

    for (const obj of sorted) {
      currentIds.add(obj.id);
      let sprite = this.objectSprites.get(obj.id);

      const def = this.getObjectDef(obj.asset) as unknown as { texture?: PIXI.Texture; anchorX?: number; anchorY?: number } | null;
      const tex = def?.texture;

      if (!sprite) {
        sprite = new PIXI.Sprite(tex || PIXI.Texture.WHITE);
        this.objectSprites.set(obj.id, sprite);
      } else if (tex && sprite.texture !== tex) {
        sprite.texture = tex;
      }

      sprite.x = obj.x;
      sprite.y = obj.y;
      sprite.scale.set(obj.scaleX, obj.scaleY);
      sprite.rotation = obj.rotation;
      sprite.anchor.set(
        obj.anchorX !== undefined ? obj.anchorX : (def?.anchorX ?? 0.5),
        obj.anchorY !== undefined ? obj.anchorY : (def?.anchorY ?? 1.0)
      );

      this.objectsContainer.addChild(sprite);
    }

    // Cleanup stale sprites
    for (const [id] of this.objectSprites) {
      if (!currentIds.has(id)) {
        this.objectSprites.delete(id);
      }
    }
  }

  private renderCollision(map: GameMap, visible: boolean): void {
    if (!this.collisionGraphics) return;
    this.collisionGraphics.clear();
    if (!visible) return;

    // Tile grid collisions
    this.collisionGraphics.beginFill(0xef4444, 0.35);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.getCollision(x, y)) {
          this.collisionGraphics.drawRect(
            x * map.tileSize,
            y * map.tileSize,
            map.tileSize,
            map.tileSize
          );
        }
      }
    }
    this.collisionGraphics.endFill();
  }

  private renderGizmo(map: GameMap, state: Readonly<EditorStateModel>): void {
    if (!this.gizmoGraphics) return;
    this.gizmoGraphics.clear();

    if (!state.selectedObjectId) return;
    const obj = map.getObject(state.selectedObjectId);
    if (!obj) return;

    const def = this.getObjectDef(obj.asset);
    if (!def) return;

    // Draw selection box
    this.gizmoGraphics.lineStyle(1.5, 0x38bdf8, 0.9);
    
    // Draw anchor cross
    if (state.anchorsVisible) {
      this.gizmoGraphics.lineStyle(1.5, 0xef4444, 1.0);
      this.gizmoGraphics.moveTo(obj.x - 8, obj.y);
      this.gizmoGraphics.lineTo(obj.x + 8, obj.y);
      this.gizmoGraphics.moveTo(obj.x, obj.y - 8);
      this.gizmoGraphics.lineTo(obj.x, obj.y + 8);
      this.gizmoGraphics.drawCircle(obj.x, obj.y, 4);
    }
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: false, baseTexture: false });
      this.app = null;
    }
  }
}
