/**
 * Editor.js
 * Main Map Editor Engine orchestrating PixiJS, layers, camera, tools, history, and UI.
 */

import * as PIXI from 'pixi.js';
import { AssetManager } from './AssetManager.js';
import { GameMap } from './Map.js';
import { TerrainLayer } from './TerrainLayer.js';
import { ObjectLayer } from './ObjectLayer.js';
import { ObjectManager } from './ObjectManager.js';
import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { History } from './History.js';
import { Generators } from './Generators.js';
import { MapSerializer } from './MapSerializer.js';
import { UI } from './UI.js';

export class Editor {
  constructor() {
    this.app = null;
    this.map = null;
    this.assetManager = null;
    this.terrainLayer = null;
    this.objectLayer = null;
    this.objectManager = null;
    this.camera = null;
    this.inputManager = null;
    this.history = null;
    this.ui = null;

    // View toggles
    this.showGrid = true;
    this.showCollisions = true;
    this.showAnchors = false;
    this.showDepthLines = false;

    // FPS Counter
    this.fpsFrames = 0;
    this.fpsLastTime = performance.now();
  }

  async init() {
    // 1. Initialize PixiJS Application
    const containerEl = document.getElementById('viewport-container');
    const width = containerEl.clientWidth || window.innerWidth - 580;
    const height = containerEl.clientHeight || window.innerHeight - 114;

    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0c0e12,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    containerEl.appendChild(this.app.view);
    this.app.view.style.width = '100%';
    this.app.view.style.height = '100%';

    // Handle viewport resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerEl.clientWidth > 0 && containerEl.clientHeight > 0) {
        this.app.renderer.resize(containerEl.clientWidth, containerEl.clientHeight);
        if (this.camera) this.camera.applyTransform();
      }
    });
    resizeObserver.observe(containerEl);

    // 2. Initialize Asset Manager
    this.assetManager = new AssetManager();
    await this.assetManager.init();

    // 3. Initialize History
    this.history = new History();

    // 4. Initialize default MMO Game Map (64x64 tiles)
    this.map = new GameMap({
      width: 64,
      height: 64,
      tileSize: 32,
      chunkSize: 32,
      defaultTerrain: 'grass'
    });

    // 5. Create Root World Container for Camera
    this.worldContainer = new PIXI.Container();
    this.worldContainer.name = 'WorldContainer';
    this.app.stage.addChild(this.worldContainer);

    // 6. Create Layers
    this.terrainLayer = new TerrainLayer(this.map, this.assetManager);
    this.worldContainer.addChild(this.terrainLayer.container);

    this.objectLayer = new ObjectLayer(this.map, this.assetManager);
    this.worldContainer.addChild(this.objectLayer.container);

    // 7. Object Manager
    this.objectManager = new ObjectManager(this.map, this.objectLayer, this.assetManager, this.history);

    // 8. Camera
    this.camera = new Camera(this.worldContainer, this.app, this.map);
    this.camera.onTransformChanged = ({ zoom, viewBounds }) => {
      if (this.ui) this.ui.updateZoom(zoom);
      this.updateCulling(viewBounds);
    };

    // 9. Input Manager
    this.inputManager = new InputManager(this);

    // 10. UI Controller
    this.ui = new UI(this);
    this.ui.init();

    // Connect History notifications to UI
    this.history.onChanged = ({ canUndo, canRedo }) => {
      this.ui.updateHistoryButtons(canUndo, canRedo);
    };

    // 11. Initial Sample Map Population (Demo scenery with trees, house, rocks, NPCs)
    this.populateSampleMap();

    // 12. Center Camera
    this.camera.centerOnMap();

    // Perform initial culling pass
    this.updateCulling();

    // 13. PixiJS Main Ticker Loop
    this.app.ticker.add((delta) => this.onTick(delta));
  }

  /**
   * Updates Frustum / Viewport Culling across Terrain & Object layers
   */
  updateCulling(bounds = null) {
    if (!this.camera || !this.map) return;
    const viewBounds = bounds || this.camera.getViewBounds(128);

    if (this.terrainLayer) {
      this.terrainLayer.cull(viewBounds);
    }
    if (this.objectLayer) {
      this.objectLayer.cull(viewBounds);
    }

    if (this.ui && this.ui.dom.statusObjectsCount) {
      const vis = this.objectLayer ? this.objectLayer.visibleObjectsCount : this.map.objects.length;
      const tot = this.map.objects.length;
      this.ui.dom.statusObjectsCount.textContent = tot > 0 ? `${vis}/${tot}` : '0';
    }
  }

  /**
   * Builds an attractive sample RPG layout to demonstrate the features instantly on launch
   */
  populateSampleMap() {
    // Dirt road path in middle
    for (let x = 20; x <= 44; x++) {
      this.map.setTile(x, 30, 'dirt');
      this.map.setTile(x, 31, 'dirt');
      this.map.setTile(x, 32, 'dirt');
    }
    // Cobblestone town square
    for (let y = 28; y <= 34; y++) {
      for (let x = 30; x <= 36; x++) {
        this.map.setTile(x, y, 'stone');
      }
    }
    // Water pond on the left
    for (let y = 14; y <= 22; y++) {
      for (let x = 8; x <= 18; x++) {
        if (Math.hypot(x - 13, y - 18) <= 4.5) {
          this.map.setTile(x, y, 'water');
        }
      }
    }

    this.terrainLayer.rebuildAll();

    // Place sample objects
    // Cottage on the town square
    this.objectManager.placeObject('house_wood', 33 * 32, 28 * 32);
    // Lamp posts
    this.objectManager.placeObject('lamp_post', 29 * 32, 32 * 32);
    this.objectManager.placeObject('lamp_post', 37 * 32, 32 * 32);
    // Guard NPC
    this.objectManager.placeObject('npc_knight', 33 * 32, 32 * 32);
    // Chest & Barrels
    this.objectManager.placeObject('chest', 35 * 32, 30 * 32);
    this.objectManager.placeObject('barrel', 30 * 32, 29 * 32);
    this.objectManager.placeObject('fence_wood', 26 * 32, 29 * 32);

    // Some trees & rocks around pond
    this.objectManager.placeObject('tree_oak', 12 * 32, 12 * 32);
    this.objectManager.placeObject('tree_pine', 19 * 32, 15 * 32);
    this.objectManager.placeObject('tree_oak', 8 * 32, 24 * 32);
    this.objectManager.placeObject('rock_large', 16 * 32, 24 * 32);
    this.objectManager.placeObject('rock_small', 18 * 32, 25 * 32);
    this.objectManager.placeObject('bush', 23 * 32, 33 * 32);

    this.ui.updateHierarchyList();
  }

  onTick(delta) {
    // 1. Update interactive player walking if enabled
    if (this.objectManager.playerMode) {
      this.objectManager.updatePlayerPosition();
    }

    // 2. FPS Counter calculation
    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime >= 1000) {
      const fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      if (this.ui && this.ui.dom.statusFps) {
        this.ui.dom.statusFps.textContent = `${fps} FPS`;
      }
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }
  }

  /* =========================================================================
     COMMAND / ENGINE ACTIONS
     ========================================================================= */

  createNewMap(width, height, defaultTerrain) {
    this.map = new GameMap({
      width,
      height,
      tileSize: 32,
      chunkSize: 32,
      defaultTerrain
    });

    this.terrainLayer.map = this.map;
    this.terrainLayer.rebuildAll();

    this.objectLayer.map = this.map;
    this.objectLayer.rebuildAll();

    this.objectManager.map = this.map;
    this.objectManager.clearSelection();

    this.camera.map = this.map;
    this.camera.centerOnMap();

    this.history.clear();
    this.ui.updateHierarchyList();
    this.ui.updateInspector(null);
    this.updateCulling();
  }

  saveMapJSON() {
    MapSerializer.downloadJSON(this.map, `mmo_map_${Date.now()}.json`);
  }

  loadMapJSON(jsonString) {
    const data = MapSerializer.fromJSON(jsonString);
    this.loadMapData(data);
  }

  loadMapData(data) {
    this.map = new GameMap({
      width: data.width,
      height: data.height,
      tileSize: data.tileSize || 32,
      chunkSize: data.chunkSize || 32
    });
    this.map.terrain = data.terrain;
    this.map.objects = data.objects;

    this.terrainLayer.map = this.map;
    this.terrainLayer.rebuildAll();

    this.objectLayer.map = this.map;
    this.objectLayer.rebuildAll();

    this.objectManager.map = this.map;
    this.objectManager.clearSelection();

    this.camera.map = this.map;
    this.camera.centerOnMap();

    this.ui.updateHierarchyList();
    this.ui.updateInspector(null);
    this.updateCulling();
  }

  exportPNG() {
    MapSerializer.exportPNG(this.app, this.worldContainer, `mmo_map_render_${Date.now()}.png`);
  }

  fillAllTerrain(terrainId) {
    const prevMapData = MapSerializer.toJSON(this.map);
    this.map.fillTerrain(terrainId);
    this.terrainLayer.rebuildAll();
    const newMapData = MapSerializer.toJSON(this.map);

    this.history.push({
      type: 'MAP_RESTORE',
      oldMap: prevMapData,
      newMap: newMapData
    });
    this.updateCulling();
  }

  clearAllObjects() {
    if (this.map.objects.length === 0) return;
    const prevObjects = [...this.map.objects];
    this.map.clearObjects();
    this.objectLayer.rebuildAll();
    this.objectManager.clearSelection();
    this.ui.updateHierarchyList();
    this.ui.updateInspector(null);
    this.updateCulling();

    this.history.push({
      type: 'OBJECTS_BATCH_ADD',
      objects: prevObjects,
      isClearUndo: true
    });
  }

  generateForest() {
    Generators.generateForest(this.map, this.objectLayer, this.assetManager, this.history, {
      density: this.objectManager.brushConfig.density,
      scaleVariation: 0.2,
      rotVariation: 0.1
    });
    this.ui.updateHierarchyList();
    this.updateCulling();
  }

  generateRocks() {
    Generators.generateRocks(this.map, this.objectLayer, this.assetManager, this.history, {
      density: 0.35
    });
    this.ui.updateHierarchyList();
    this.updateCulling();
  }

  toggleGrid() {
    this.showGrid = !this.showGrid;
    this.terrainLayer.setGridVisible(this.showGrid);
    if (this.ui && this.ui.dom.btnGrid) {
      this.ui.dom.btnGrid.classList.toggle('active', this.showGrid);
    }
  }

  toggleCollisions() {
    this.showCollisions = !this.showCollisions;
    this.objectLayer.setCollisionsVisible(this.showCollisions);
    if (this.ui && this.ui.dom.btnCollision) {
      this.ui.dom.btnCollision.classList.toggle('active', this.showCollisions);
    }
  }

  toggleAnchors() {
    this.showAnchors = !this.showAnchors;
    this.objectLayer.setAnchorsVisible(this.showAnchors);
  }

  toggleDepthLines() {
    this.showDepthLines = !this.showDepthLines;
    this.objectLayer.setDepthLinesVisible(this.showDepthLines);
  }

  togglePlayerMode() {
    const active = this.objectManager.togglePlayerMode();
    this.ui.updatePlayerHUD(active);
  }
}
