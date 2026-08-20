/**
 * ObjectLayer.js
 * PixiJS rendering layer for all free-coordinate Objects, Hitboxes,
 * Transform Gizmos and Anchor indicators.
 * Objects NEVER alter or erase the terrain below them.
 */

import * as PIXI from 'pixi.js';
import { DepthSorter } from './DepthSorter.js';

export class ObjectLayer {
  constructor(map, assetManager) {
    this.map = map;
    this.assetManager = assetManager;

    // Root Pixi Container for Object Layer
    this.container = new PIXI.Container();
    this.container.name = 'ObjectLayer';
    this.container.sortableChildren = true;

    // Sub-container specifically for entity sprites so they are sorted together
    this.spritesContainer = new PIXI.Container();
    this.spritesContainer.name = 'SpritesContainer';
    this.spritesContainer.sortableChildren = true;
    this.container.addChild(this.spritesContainer);

    // Collision overlay graphics (rendered on top of objects or toggleable)
    this.collisionGraphics = new PIXI.Graphics();
    this.collisionGraphics.name = 'CollisionOverlay';
    this.container.addChild(this.collisionGraphics);
    this.showCollisions = true;

    // Selection & Transform Gizmo graphics
    this.gizmoGraphics = new PIXI.Graphics();
    this.gizmoGraphics.name = 'GizmoOverlay';
    this.container.addChild(this.gizmoGraphics);

    // Anchor & Depth line debug graphics
    this.debugGraphics = new PIXI.Graphics();
    this.debugGraphics.name = 'DebugOverlay';
    this.container.addChild(this.debugGraphics);
    this.showAnchors = false;
    this.showDepthLines = false;

    // Map of objectId -> Pixi.Sprite / Container
    this.objectSprites = new Map();

    // Depth Sorter
    this.depthSorter = new DepthSorter(this.spritesContainer);

    this.selectedObjectId = null;

    // Viewport Culling State
    this.lastViewBounds = null;
    this.visibleObjectsCount = 0;

    this.rebuildAll();
  }

  /**
   * Rebuilds all object sprites from the map
   */
  rebuildAll() {
    this.spritesContainer.removeChildren();
    this.objectSprites.clear();

    for (const objData of this.map.objects) {
      this.createObjectSprite(objData);
    }

    this.depthSorter.updateDepthSorting();
    if (this.lastViewBounds) {
      this.cull(this.lastViewBounds);
    } else {
      this.renderOverlays();
    }
  }

  /**
   * Performs frustum / viewport culling on all object sprites and overlays.
   * Only sprites and overlay geometries within the camera's view bounds are sent to WebGL.
   * @param {{ minX: number, minY: number, maxX: number, maxY: number } | null} viewBounds
   */
  cull(viewBounds) {
    this.lastViewBounds = viewBounds;
    let visibleCount = 0;

    for (let i = 0; i < this.map.objects.length; i++) {
      const obj = this.map.objects[i];
      const sprite = this.objectSprites.get(obj.id);
      if (!sprite) continue;

      const isVisible = viewBounds
        ? this.map.isObjectInBounds(obj, viewBounds, this.assetManager)
        : true;

      sprite.visible = isVisible;
      sprite.renderable = isVisible;

      if (isVisible) {
        visibleCount++;
      }
    }

    this.visibleObjectsCount = visibleCount;
    this.renderOverlays();
  }

  /**
   * Creates a Pixi Sprite for an object definition
   */
  createObjectSprite(objData) {
    const def = this.assetManager.getObjectDef(objData.asset);
    if (!def) {
      console.warn(`Asset definition not found for: ${objData.asset}`);
      return null;
    }

    const sprite = new PIXI.Sprite(def.texture);
    sprite.name = objData.id;
    sprite.objectData = objData;

    // Set anchor point (pivot)
    sprite.anchor.set(
      objData.anchorX !== undefined ? objData.anchorX : def.anchorX,
      objData.anchorY !== undefined ? objData.anchorY : def.anchorY
    );

    // Transform
    sprite.position.set(objData.x, objData.y);
    sprite.scale.set(objData.scaleX, objData.scaleY);
    sprite.rotation = objData.rotation;

    // Z-Index based on Y for depth sorting
    sprite.zIndex = Math.floor(objData.y);

    this.spritesContainer.addChild(sprite);
    this.objectSprites.set(objData.id, sprite);

    return sprite;
  }

  /**
   * Adds an object dynamically
   */
  addObject(objData) {
    const sprite = this.createObjectSprite(objData);
    if (sprite) {
      if (this.lastViewBounds) {
        const isVis = this.map.isObjectInBounds(objData, this.lastViewBounds, this.assetManager);
        sprite.visible = isVis;
        sprite.renderable = isVis;
        if (isVis) this.visibleObjectsCount++;
      }
      this.depthSorter.sortEntity(sprite);
      this.renderOverlays();
    }
    return sprite;
  }

  /**
   * Removes an object sprite
   */
  removeObject(id) {
    const sprite = this.objectSprites.get(id);
    if (sprite) {
      if (sprite.visible) {
        this.visibleObjectsCount = Math.max(0, this.visibleObjectsCount - 1);
      }
      this.spritesContainer.removeChild(sprite);
      this.objectSprites.delete(id);
      if (this.selectedObjectId === id) {
        this.selectedObjectId = null;
      }
      this.renderOverlays();
      return true;
    }
    return false;
  }

  /**
   * Updates an existing object's sprite transform & properties
   */
  updateObjectTransform(objData) {
    const sprite = this.objectSprites.get(objData.id);
    if (!sprite) return;

    sprite.position.set(objData.x, objData.y);
    sprite.scale.set(objData.scaleX, objData.scaleY);
    sprite.rotation = objData.rotation;
    sprite.anchor.set(objData.anchorX, objData.anchorY);

    if (this.lastViewBounds) {
      const isVis = this.map.isObjectInBounds(objData, this.lastViewBounds, this.assetManager);
      sprite.visible = isVis;
      sprite.renderable = isVis;
    }

    this.depthSorter.sortEntity(sprite);
    this.renderOverlays();
  }

  setSelectedObject(id) {
    this.selectedObjectId = id;
    this.renderOverlays();
  }

  setCollisionsVisible(visible) {
    this.showCollisions = visible;
    this.renderOverlays();
  }

  setAnchorsVisible(visible) {
    this.showAnchors = visible;
    this.renderOverlays();
  }

  setDepthLinesVisible(visible) {
    this.showDepthLines = visible;
    this.renderOverlays();
  }

  /**
   * Renders Gizmos, Hitboxes, Anchor points and Depth debug lines
   */
  renderOverlays() {
    this.renderCollisionOverlay();
    this.renderSelectionGizmo();
    this.renderDebugOverlay();
  }

  renderCollisionOverlay() {
    this.collisionGraphics.clear();
    if (!this.showCollisions) return;

    for (const obj of this.map.objects) {
      if (!obj.collision) continue;

      // Skip offscreen objects for overlay graphics rendering
      if (this.lastViewBounds && !this.map.isObjectInBounds(obj, this.lastViewBounds, this.assetManager)) {
        continue;
      }

      const def = this.assetManager.getObjectDef(obj.asset);
      if (!def) continue;

      const box = obj.collisionBox || def.collisionBox;
      if (!box) continue;

      const scaleX = Math.abs(obj.scaleX);
      const scaleY = Math.abs(obj.scaleY);

      const boxW = box.width * scaleX;
      const boxH = box.height * scaleY;
      const boxX = obj.x + (box.offsetX || 0) * scaleX - boxW / 2;
      const boxY = obj.y + (box.offsetY || 0) * scaleY - boxH / 2;

      // Draw semi-transparent red/orange collision footprint
      this.collisionGraphics.lineStyle(1.5, 0xef4444, 0.9);
      this.collisionGraphics.beginFill(0xef4444, 0.35);
      this.collisionGraphics.drawRoundedRect(boxX, boxY, boxW, boxH, 4);
      this.collisionGraphics.endFill();

      // Foot contact point indicator
      this.collisionGraphics.lineStyle(1, 0xfbbf24, 0.8);
      this.collisionGraphics.drawCircle(obj.x, obj.y, 2);
    }
  }

  renderSelectionGizmo() {
    this.gizmoGraphics.clear();
    if (!this.selectedObjectId) return;

    const obj = this.map.getObject(this.selectedObjectId);
    if (!obj) return;

    const def = this.assetManager.getObjectDef(obj.asset);
    if (!def) return;

    const w = def.width * obj.scaleX;
    const h = def.height * obj.scaleY;
    const anchorX = obj.anchorX;
    const anchorY = obj.anchorY;

    // Calculate bounding box corners taking rotation into account
    const cos = Math.cos(obj.rotation);
    const sin = Math.sin(obj.rotation);

    const left = -w * anchorX;
    const top = -h * anchorY;
    const right = left + w;
    const bottom = top + h;

    const corners = [
      { x: left, y: top },
      { x: right, y: top },
      { x: right, y: bottom },
      { x: left, y: bottom }
    ].map(p => ({
      x: obj.x + (p.x * cos - p.y * sin),
      y: obj.y + (p.x * sin + p.y * cos)
    }));

    // Bounding Box outline (Bright Blue)
    this.gizmoGraphics.lineStyle(2, 0x4f8cff, 1);
    this.gizmoGraphics.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) {
      this.gizmoGraphics.lineTo(corners[i].x, corners[i].y);
    }
    this.gizmoGraphics.lineTo(corners[0].x, corners[0].y);

    // Corner Scale Handles
    for (const c of corners) {
      this.gizmoGraphics.lineStyle(1, 0xffffff, 1);
      this.gizmoGraphics.beginFill(0x4f8cff, 1);
      this.gizmoGraphics.drawRect(c.x - 4, c.y - 4, 8, 8);
      this.gizmoGraphics.endFill();
    }

    // Anchor Point Indicator (Golden Crosshair on Ground)
    this.gizmoGraphics.lineStyle(2, 0xf59e0b, 1);
    this.gizmoGraphics.beginFill(0xfef08a, 1);
    this.gizmoGraphics.drawCircle(obj.x, obj.y, 4);
    this.gizmoGraphics.endFill();

    this.gizmoGraphics.moveTo(obj.x - 8, obj.y);
    this.gizmoGraphics.lineTo(obj.x + 8, obj.y);
    this.gizmoGraphics.moveTo(obj.x, obj.y - 8);
    this.gizmoGraphics.lineTo(obj.x, obj.y + 8);

    // Rotation Handle (Stem & Ball on top)
    const topCenterX = (corners[0].x + corners[1].x) / 2;
    const topCenterY = (corners[0].y + corners[1].y) / 2;
    const rotStemDist = 24;
    const rotHandleX = topCenterX - sin * rotStemDist;
    const rotHandleY = topCenterY - cos * rotStemDist;

    this.gizmoGraphics.lineStyle(1.5, 0x4f8cff, 0.8);
    this.gizmoGraphics.moveTo(topCenterX, topCenterY);
    this.gizmoGraphics.lineTo(rotHandleX, rotHandleY);

    this.gizmoGraphics.lineStyle(1.5, 0xffffff, 1);
    this.gizmoGraphics.beginFill(0x10b981, 1);
    this.gizmoGraphics.drawCircle(rotHandleX, rotHandleY, 5);
    this.gizmoGraphics.endFill();
  }

  renderDebugOverlay() {
    this.debugGraphics.clear();
    if (!this.showAnchors && !this.showDepthLines) return;

    for (const obj of this.map.objects) {
      // Skip offscreen objects
      if (this.lastViewBounds && !this.map.isObjectInBounds(obj, this.lastViewBounds, this.assetManager)) {
        continue;
      }

      // Depth sorting horizontal baseline
      if (this.showDepthLines) {
        this.debugGraphics.lineStyle(1, 0xa855f7, 0.4);
        this.debugGraphics.moveTo(obj.x - 40, obj.y);
        this.debugGraphics.lineTo(obj.x + 40, obj.y);
      }

      // Anchor Point Dot
      if (this.showAnchors) {
        this.debugGraphics.lineStyle(1, 0x06b6d4, 0.8);
        this.debugGraphics.beginFill(0x06b6d4, 0.5);
        this.debugGraphics.drawCircle(obj.x, obj.y, 3);
        this.debugGraphics.endFill();
      }
    }
  }
}
