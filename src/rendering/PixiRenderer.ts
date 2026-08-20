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
import { AssetManager } from '../assets/AssetManager';

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
  private dirtyChunks: Set<string> = new Set();
  private isAllTerrainDirty = true;
  private areObjectsDirty = true;
  private isGridDirty = true;
  private isCollisionDirty = true;

  // RAF Scheduling
  private rafId: number | null = null;
  private pendingMap: GameMap | null = null;
  private pendingState: Readonly<EditorStateModel> | null = null;

  // Player avatar state
  private playerPos = { x: 33 * 32, y: 32 * 32 };
  private playerSprite: PIXI.Sprite | null = null;

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

    this.isAllTerrainDirty = true;
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

  invalidateTerrain(chunkKey?: string): void {
    if (chunkKey) {
      this.dirtyChunks.add(chunkKey);
    } else {
      this.isAllTerrainDirty = true;
      this.dirtyChunks.clear();
    }
  }

  setPlayerPosition(x: number, y: number): void {
    this.playerPos = { x, y };
    if (this.playerSprite) {
      this.playerSprite.position.set(x, y);
    }
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

  scheduleRender(map: GameMap, state: Readonly<EditorStateModel>): void {
    this.pendingMap = map;
    this.pendingState = state;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        if (this.pendingMap && this.pendingState) {
          this.render(this.pendingMap, this.pendingState);
        }
      });
    }
  }

  render(map: GameMap, state: Readonly<EditorStateModel>): void {
    if (!this.app || !this.worldContainer) return;

    this.updateCameraTransform();

    if (this.isAllTerrainDirty || this.dirtyChunks.size > 0) {
      this.renderTerrain(map);
      this.isAllTerrainDirty = false;
      this.dirtyChunks.clear();
    } else {
      this.cullTerrainChunks(map);
    }

    if (this.isGridDirty) {
      this.renderGrid(map, state.gridVisible);
      this.isGridDirty = false;
    }

    if (this.areObjectsDirty) {
      this.renderObjects(map);
      this.areObjectsDirty = false;
    }

    if (this.isCollisionDirty || state.collisionVisible) {
      this.renderCollision(map, state.collisionVisible);
      this.isCollisionDirty = false;
    }

    this.renderPlayer(state.playerMode);
    this.renderGizmo(map, state);
    this.app.render();
  }

  private cullTerrainChunks(map: GameMap): void {
    const bounds = this.camera.getViewportBounds(64);
    const chunkSizePx = (map.chunkSize || 16) * map.tileSize;

    for (const [key, container] of this.chunkContainers.entries()) {
      const [cxStr, cyStr] = key.split('_');
      const cx = parseInt(cxStr, 10);
      const cy = parseInt(cyStr, 10);
      const chunkLeft = cx * chunkSizePx;
      const chunkTop = cy * chunkSizePx;
      const chunkRight = chunkLeft + chunkSizePx;
      const chunkBottom = chunkTop + chunkSizePx;

      const isVisible =
        chunkRight >= bounds.minX &&
        chunkLeft <= bounds.maxX &&
        chunkBottom >= bounds.minY &&
        chunkTop <= bounds.maxY;

      container.visible = isVisible;
    }
  }

  private renderTerrain(map: GameMap): void {
    if (!this.terrainContainer) return;

    const chunkSize = map.chunkSize || 16;
    const numChunksX = Math.ceil(map.width / chunkSize);
    const numChunksY = Math.ceil(map.height / chunkSize);
    const bounds = this.camera.getViewportBounds(64);
    const chunkSizePx = chunkSize * map.tileSize;

    const rebuildAll = this.isAllTerrainDirty;

    for (let cy = 0; cy < numChunksY; cy++) {
      for (let cx = 0; cx < numChunksX; cx++) {
        const chunkKey = `${cx}_${cy}`;
        const chunkLeft = cx * chunkSizePx;
        const chunkTop = cy * chunkSizePx;
        const chunkRight = chunkLeft + chunkSizePx;
        const chunkBottom = chunkTop + chunkSizePx;

        const isVisible =
          chunkRight >= bounds.minX &&
          chunkLeft <= bounds.maxX &&
          chunkBottom >= bounds.minY &&
          chunkTop <= bounds.maxY;

        let chunkCont = this.chunkContainers.get(chunkKey);

        if (rebuildAll || this.dirtyChunks.has(chunkKey) || !chunkCont) {
          if (!chunkCont) {
            chunkCont = new PIXI.Container();
            this.chunkContainers.set(chunkKey, chunkCont);
            this.terrainContainer.addChild(chunkCont);
          } else {
            chunkCont.removeChildren();
          }

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
        }

        if (chunkCont) {
          chunkCont.visible = isVisible;
        }
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

  private renderPlayer(active: boolean): void {
    if (!this.playerGraphics) return;
    this.playerGraphics.clear();

    if (!active) {
      if (this.playerSprite) {
        this.playerSprite.visible = false;
      }
      return;
    }

    // Draw player shadow
    this.playerGraphics.beginFill(0x000000, 0.4);
    this.playerGraphics.drawEllipse(this.playerPos.x, this.playerPos.y, 10, 4);
    this.playerGraphics.endFill();

    // Draw player sprite if available
    if (this.assetManager.playerTexture) {
      if (!this.playerSprite) {
        this.playerSprite = new PIXI.Sprite(this.assetManager.playerTexture);
        this.playerSprite.anchor.set(0.5, 0.9);
        this.worldContainer?.addChild(this.playerSprite);
      }
      this.playerSprite.visible = true;
      this.playerSprite.position.set(this.playerPos.x, this.playerPos.y);
    } else {
      // Fallback stylized character marker
      this.playerGraphics.beginFill(0x10b981, 0.9);
      this.playerGraphics.drawCircle(this.playerPos.x, this.playerPos.y - 12, 8);
      this.playerGraphics.endFill();
    }
  }

  private renderCollision(map: GameMap, visible: boolean): void {
    if (!this.collisionGraphics) return;
    this.collisionGraphics.clear();
    if (!visible) return;

    // 1. Tile grid collisions (Red semi-transparent)
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

    // 2. Object collision boxes (Amber/Orange with border)
    for (const obj of map.objects) {
      if (obj.collision === false) continue;

      const def = this.getObjectDef(obj.asset);
      const colBox = obj.collisionBox || def?.collisionBox;
      if (!colBox) continue;

      const halfW = colBox.width / 2;
      const halfH = colBox.height / 2;
      const minX = colBox.offsetX - halfW;
      const maxX = colBox.offsetX + halfW;
      const minY = colBox.offsetY - halfH;
      const maxY = colBox.offsetY + halfH;

      const cos = Math.cos(obj.rotation || 0);
      const sin = Math.sin(obj.rotation || 0);
      const sx = obj.scaleX || 1;
      const sy = obj.scaleY || 1;

      const transformLocalToWorld = (lx: number, ly: number) => {
        const scaledX = lx * sx;
        const scaledY = ly * sy;
        return {
          x: obj.x + (scaledX * cos - scaledY * sin),
          y: obj.y + (scaledX * sin + scaledY * cos)
        };
      };

      const p1 = transformLocalToWorld(minX, minY);
      const p2 = transformLocalToWorld(maxX, minY);
      const p3 = transformLocalToWorld(maxX, maxY);
      const p4 = transformLocalToWorld(minX, maxY);

      this.collisionGraphics.lineStyle(1.5, 0xd97706, 0.95);
      this.collisionGraphics.beginFill(0xf59e0b, 0.45);
      this.collisionGraphics.moveTo(p1.x, p1.y);
      this.collisionGraphics.lineTo(p2.x, p2.y);
      this.collisionGraphics.lineTo(p3.x, p3.y);
      this.collisionGraphics.lineTo(p4.x, p4.y);
      this.collisionGraphics.closePath();
      this.collisionGraphics.endFill();
    }
  }

  private renderGizmo(map: GameMap, state: Readonly<EditorStateModel>): void {
    if (!this.gizmoGraphics) return;
    this.gizmoGraphics.clear();

    if (!state.selectedObjectId) return;
    const obj = map.getObject(state.selectedObjectId);
    if (!obj) return;

    const def = this.getObjectDef(obj.asset);
    if (!def) return;

    const width = (def.width || 32) * Math.abs(obj.scaleX);
    const height = (def.height || 32) * Math.abs(obj.scaleY);
    const ax = obj.anchorX !== undefined ? obj.anchorX : (def.anchorX ?? 0.5);
    const ay = obj.anchorY !== undefined ? obj.anchorY : (def.anchorY ?? 1.0);

    const left = -ax * width;
    const top = -ay * height;

    // Draw selection bounding rectangle with rotation
    this.gizmoGraphics.lineStyle(1.5, 0x38bdf8, 0.9);
    
    // Compute corner points rotated around object center
    const cos = Math.cos(obj.rotation);
    const sin = Math.sin(obj.rotation);

    const transformPoint = (px: number, py: number) => ({
      x: obj.x + (px * cos - py * sin),
      y: obj.y + (px * sin + py * cos)
    });

    const p1 = transformPoint(left, top);
    const p2 = transformPoint(left + width, top);
    const p3 = transformPoint(left + width, top + height);
    const p4 = transformPoint(left, top + height);

    // Draw box
    this.gizmoGraphics.moveTo(p1.x, p1.y);
    this.gizmoGraphics.lineTo(p2.x, p2.y);
    this.gizmoGraphics.lineTo(p3.x, p3.y);
    this.gizmoGraphics.lineTo(p4.x, p4.y);
    this.gizmoGraphics.closePath();

    // Draw selection corner handles
    this.gizmoGraphics.beginFill(0x38bdf8, 1);
    const handleSize = 4;
    [p1, p2, p3, p4].forEach(p => {
      this.gizmoGraphics?.drawRect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
    });
    this.gizmoGraphics.endFill();

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
