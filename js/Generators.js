/**
 * Generators.js
 * Procedural generation algorithms for natural forests, rock fields, and environment decoration.
 */

export class Generators {
  /**
   * Generates a procedural forest across the map with organic density and spacing.
   */
  static generateForest(map, objectLayer, assetManager, history, options = {}) {
    const density = options.density !== undefined ? options.density : 0.7; // 70%
    const scaleVar = options.scaleVariation !== undefined ? options.scaleVariation : 0.2; // 20%
    const rotVar = options.rotVariation !== undefined ? options.rotVariation : 0.1; // 10%
    const minDistance = options.minDistance || 52; // Spacing so trees don't stack on top of each other
    const treeTypes = options.treeTypes || ['tree_oak', 'tree_pine', 'tree_oak'];

    const targetTerrain = options.targetTerrain || 'grass';
    const addedObjects = [];
    const positions = [];

    // Collect existing object positions to avoid collisions
    for (const obj of map.objects) {
      positions.push({ x: obj.x, y: obj.y });
    }

    const ts = map.tileSize;
    const step = 2; // Step every 2 tiles for forest grid sampling

    for (let ty = 2; ty < map.height - 2; ty += step) {
      for (let tx = 2; tx < map.width - 2; tx += step) {
        const currentTile = map.getTile(tx, ty);
        if (targetTerrain && currentTile !== targetTerrain) continue;

        // Density probability check
        if (Math.random() > density) continue;

        // Add organic jitter inside the local 2x2 tile cell
        const jitterX = (Math.random() - 0.5) * (ts * 1.5);
        const jitterY = (Math.random() - 0.5) * (ts * 1.5);
        const posX = Math.round(tx * ts + ts + jitterX);
        const posY = Math.round(ty * ts + ts + jitterY);

        // Distance check against all placed trees and existing objects
        let tooClose = false;
        for (const p of positions) {
          if (Math.hypot(p.x - posX, p.y - posY) < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) continue;

        // Pick random tree asset
        const asset = treeTypes[Math.floor(Math.random() * treeTypes.length)];
        const def = assetManager.getObjectDef(asset);
        if (!def) continue;

        // Scale variation: base 1.0 +- scaleVar
        const scale = 1.0 + (Math.random() * 2 - 1) * scaleVar;
        // Rotation variation: 0 +- rotVar
        const rotation = (Math.random() * 2 - 1) * rotVar;

        const objData = {
          asset,
          x: posX,
          y: posY,
          scaleX: Number(scale.toFixed(2)),
          scaleY: Number(scale.toFixed(2)),
          rotation: Number(rotation.toFixed(3)),
          anchorX: def.anchorX,
          anchorY: def.anchorY,
          collision: def.collision,
          collisionBox: def.collisionBox ? { ...def.collisionBox } : null
        };

        const added = map.addObject(objData);
        objectLayer.addObject(added);
        addedObjects.push({ ...added });
        positions.push({ x: posX, y: posY });
      }
    }

    if (history && addedObjects.length > 0) {
      history.push({
        type: 'OBJECTS_BATCH_ADD',
        objects: addedObjects
      });
    }

    return addedObjects;
  }

  /**
   * Generates boulders and rocks scattered across the map
   */
  static generateRocks(map, objectLayer, assetManager, history, options = {}) {
    const density = options.density !== undefined ? options.density : 0.35;
    const minDistance = options.minDistance || 38;
    const rockTypes = ['rock_large', 'rock_small', 'rock_small'];

    const addedObjects = [];
    const positions = [];

    for (const obj of map.objects) {
      positions.push({ x: obj.x, y: obj.y });
    }

    const ts = map.tileSize;
    const step = 3;

    for (let ty = 2; ty < map.height - 2; ty += step) {
      for (let tx = 2; tx < map.width - 2; tx += step) {
        if (Math.random() > density) continue;

        const jitterX = (Math.random() - 0.5) * (ts * 2);
        const jitterY = (Math.random() - 0.5) * (ts * 2);
        const posX = Math.round(tx * ts + ts + jitterX);
        const posY = Math.round(ty * ts + ts + jitterY);

        let tooClose = false;
        for (const p of positions) {
          if (Math.hypot(p.x - posX, p.y - posY) < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (tooClose) continue;

        const asset = rockTypes[Math.floor(Math.random() * rockTypes.length)];
        const def = assetManager.getObjectDef(asset);
        if (!def) continue;

        const scale = 0.85 + Math.random() * 0.3;
        const rotation = (Math.random() * 2 - 1) * 0.15;

        const objData = {
          asset,
          x: posX,
          y: posY,
          scaleX: Number(scale.toFixed(2)),
          scaleY: Number(scale.toFixed(2)),
          rotation: Number(rotation.toFixed(3)),
          anchorX: def.anchorX,
          anchorY: def.anchorY,
          collision: def.collision,
          collisionBox: def.collisionBox ? { ...def.collisionBox } : null
        };

        const added = map.addObject(objData);
        objectLayer.addObject(added);
        addedObjects.push({ ...added });
        positions.push({ x: posX, y: posY });
      }
    }

    if (history && addedObjects.length > 0) {
      history.push({
        type: 'OBJECTS_BATCH_ADD',
        objects: addedObjects
      });
    }

    return addedObjects;
  }
}
