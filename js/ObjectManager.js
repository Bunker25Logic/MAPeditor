/**
 * ObjectManager.js
 * Business logic for placing, selecting, modifying, and transforming objects,
 * including Scatter Object Brushes and the interactive Player Test Avatar.
 */

import * as PIXI from 'pixi.js';

export class ObjectManager {
  constructor(map, objectLayer, assetManager, history) {
    this.map = map;
    this.objectLayer = objectLayer;
    this.assetManager = assetManager;
    this.history = history;

    this.selectedObjectId = null;

    // Scatter / Object Brush Configuration
    this.brushConfig = {
      density: 0.7,          // 70% chance per tile step
      scaleMin: 0.85,        // Scale variation
      scaleMax: 1.15,
      rotVariation: 0.15,    // Radians (~8.5 degrees)
      minDistance: 32,       // Min distance between objects of brush
      snapToGrid: false
    };

    // Test Player Character state
    this.playerMode = false;
    this.playerSprite = null;
    this.playerData = {
      x: 300,
      y: 300,
      speed: 4,
      width: 40,
      height: 54,
      collisionRadius: 10
    };
    this.playerKeys = { w: false, a: false, s: false, d: false, up: false, left: false, down: false, right: false };
  }

  /**
   * Places a single object at world coordinates (wx, wy)
   */
  placeObject(assetId, wx, wy, options = {}) {
    const def = this.assetManager.getObjectDef(assetId);
    if (!def) return null;

    let x = wx;
    let y = wy;

    if (options.snapToGrid) {
      const ts = this.map.tileSize;
      x = Math.floor(wx / ts) * ts + ts / 2;
      y = Math.floor(wy / ts) * ts + ts;
    }

    const scale = options.scale !== undefined ? options.scale : (options.scaleX || 1);
    const rotation = options.rotation !== undefined ? options.rotation : 0;

    const objData = {
      asset: assetId,
      x: Math.round(x),
      y: Math.round(y),
      scaleX: Number(scale.toFixed(2)),
      scaleY: Number(scale.toFixed(2)),
      rotation: Number(rotation.toFixed(3)),
      anchorX: def.anchorX,
      anchorY: def.anchorY,
      collision: def.collision,
      collisionBox: def.collisionBox ? { ...def.collisionBox } : null
    };

    const added = this.map.addObject(objData);
    this.objectLayer.addObject(added);

    if (this.history) {
      this.history.push({
        type: 'OBJECT_ADD',
        object: { ...added }
      });
    }

    return added;
  }

  /**
   * Object Brush / Scatter Brush: paints natural clusters of objects with random variations
   */
  paintObjectBrush(assetId, wx, wy) {
    const def = this.assetManager.getObjectDef(assetId);
    if (!def) return null;

    // Check minimum distance to existing objects so trees don't stack directly on top
    const minDist = this.brushConfig.minDistance;
    for (const existing of this.map.objects) {
      const dx = existing.x - wx;
      const dy = existing.y - wy;
      if (Math.hypot(dx, dy) < minDist) {
        return null; // Too close to an existing object
      }
    }

    // Apply organic random variations
    const scale = this.randomRange(this.brushConfig.scaleMin, this.brushConfig.scaleMax);
    const rot = this.randomRange(-this.brushConfig.rotVariation, this.brushConfig.rotVariation);
    const jitterX = this.randomRange(-10, 10);
    const jitterY = this.randomRange(-10, 10);

    return this.placeObject(assetId, wx + jitterX, wy + jitterY, {
      scale,
      rotation: rot
    });
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  selectObject(id) {
    this.selectedObjectId = id;
    this.objectLayer.setSelectedObject(id);
    return this.getSelectedObject();
  }

  clearSelection() {
    this.selectedObjectId = null;
    this.objectLayer.setSelectedObject(null);
  }

  getSelectedObject() {
    if (!this.selectedObjectId) return null;
    return this.map.getObject(this.selectedObjectId);
  }

  deleteSelected() {
    if (!this.selectedObjectId) return null;
    const removed = this.map.removeObject(this.selectedObjectId);
    if (removed) {
      this.objectLayer.removeObject(this.selectedObjectId);
      if (this.history) {
        this.history.push({
          type: 'OBJECT_REMOVE',
          object: { ...removed }
        });
      }
      this.selectedObjectId = null;
    }
    return removed;
  }

  deleteObjectAt(wx, wy) {
    const obj = this.map.findObjectAt(wx, wy, this.assetManager);
    if (obj) {
      const removed = this.map.removeObject(obj.id);
      this.objectLayer.removeObject(obj.id);
      if (this.history) {
        this.history.push({
          type: 'OBJECT_REMOVE',
          object: { ...removed }
        });
      }
      return removed;
    }
    return null;
  }

  updateSelectedTransform(changes) {
    const obj = this.getSelectedObject();
    if (!obj) return null;

    const oldState = { ...obj };
    Object.assign(obj, changes);

    this.objectLayer.updateObjectTransform(obj);

    return { oldState, newState: obj };
  }

  /* =========================================================================
     INTERACTIVE TEST PLAYER (WASD Real-Time Depth Sorting Verification)
     ========================================================================= */

  togglePlayerMode(enable, startX, startY) {
    this.playerMode = enable !== undefined ? enable : !this.playerMode;

    if (this.playerMode) {
      if (!this.playerSprite) {
        this.playerSprite = new PIXI.Sprite(this.assetManager.playerTexture);
        this.playerSprite.name = 'TestPlayer';
        this.playerSprite.anchor.set(0.5, 0.95);
        this.playerSprite.objectData = { id: 'test_player' };
        this.objectLayer.spritesContainer.addChild(this.playerSprite);
      }
      this.playerSprite.visible = true;
      if (startX !== undefined && startY !== undefined) {
        this.playerData.x = startX;
        this.playerData.y = startY;
      }
      this.playerSprite.position.set(this.playerData.x, this.playerData.y);
      this.objectLayer.depthSorter.sortEntity(this.playerSprite);
    } else {
      if (this.playerSprite) {
        this.playerSprite.visible = false;
      }
    }

    return this.playerMode;
  }

  updatePlayerPosition() {
    if (!this.playerMode || !this.playerSprite) return;

    let dx = 0;
    let dy = 0;

    if (this.playerKeys.w || this.playerKeys.up) dy -= 1;
    if (this.playerKeys.s || this.playerKeys.down) dy += 1;
    if (this.playerKeys.a || this.playerKeys.left) dx -= 1;
    if (this.playerKeys.d || this.playerKeys.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      const speed = this.playerData.speed;
      const moveX = (dx / len) * speed;
      const moveY = (dy / len) * speed;

      let nextX = this.playerData.x + moveX;
      let nextY = this.playerData.y + moveY;

      // Constrain within map bounds
      nextX = Math.max(16, Math.min(nextX, this.map.getWorldWidth() - 16));
      nextY = Math.max(16, Math.min(nextY, this.map.getWorldHeight() - 16));

      // Optional simple collision check with collidable objects
      let blocked = false;
      for (const obj of this.map.objects) {
        if (!obj.collision) continue;
        const def = this.assetManager.getObjectDef(obj.asset);
        if (!def) continue;
        const box = obj.collisionBox || def.collisionBox;
        if (!box) continue;

        const boxW = box.width * Math.abs(obj.scaleX);
        const boxH = box.height * Math.abs(obj.scaleY);
        const boxLeft = obj.x + (box.offsetX || 0) - boxW / 2;
        const boxRight = boxLeft + boxW;
        const boxTop = obj.y + (box.offsetY || 0) - boxH / 2;
        const boxBottom = boxTop + boxH;

        if (nextX >= boxLeft - 6 && nextX <= boxRight + 6 &&
            nextY >= boxTop - 6 && nextY <= boxBottom + 6) {
          // Soft collision / pushback
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        this.playerData.x = nextX;
        this.playerData.y = nextY;
      }

      this.playerSprite.position.set(this.playerData.x, this.playerData.y);
      this.objectLayer.depthSorter.sortEntity(this.playerSprite);
    }
  }
}
