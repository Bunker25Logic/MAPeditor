/**
 * InputManager.js
 * Handles mouse, keyboard, touch, and tool interaction events on the PixiJS canvas viewport.
 */

export class InputManager {
  constructor(editor) {
    this.editor = editor;
    this.viewportEl = document.getElementById('viewport-container');

    this.activeTool = 'brush'; // 'brush' | 'bucket' | 'eraser' | 'object_place' | 'object_brush' | 'select' | 'pan'
    this.selectedTerrain = 'grass';
    this.selectedObjectAsset = 'tree_oak';

    // Mouse & Touch drag state
    this.isPointerDown = false;
    this.pointerButton = 0; // 0: Left, 1: Middle, 2: Right
    this.isSpacePressed = false;
    this.isAltPressed = false;
    this.isShiftPressed = false;
    this.isCtrlPressed = false;

    // Multi-touch gestures (Pinch-to-Zoom & 2-Finger Pan)
    this.activePointers = new Map();
    this.isPinching = false;
    this.lastPinchDist = null;
    this.lastPinchMid = null;

    // Gizmo interaction state
    this.isDraggingObject = false;
    this.dragStartWorld = { x: 0, y: 0 };
    this.dragObjectInitialState = null;
    this.activeGizmoHandle = null; // null | 'rotate' | 'scale_nw' | etc.

    // Terrain stroke batch for undo/redo
    this.currentTileStroke = [];
    this.lastPaintedTile = null;

    this.setupEvents();
  }

  setupEvents() {
    const el = this.viewportEl;

    // Viewport mouse / pointer events
    el.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerCancel(e));
    el.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  setTool(tool) {
    this.activeTool = tool;
    this.editor.ui.updateActiveTool(tool);

    if (tool !== 'select') {
      this.editor.objectManager.clearSelection();
    }

    if (tool === 'pan') {
      this.viewportEl.classList.add('panning');
    } else {
      this.viewportEl.classList.remove('panning');
    }
  }

  onPointerDown(e) {
    // If clicking on floating HUD, D-Pad or controls, skip
    if (e.target.closest('.viewport-overlay-controls') || 
        e.target.closest('.player-mode-hud') ||
        e.target.closest('.virtual-dpad-container')) return;

    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Handle 2-Finger Touch Gestures (Pinch to Zoom & Pan)
    if (this.activePointers.size === 2) {
      this.isPinching = true;
      this.isPointerDown = false;
      this.currentTileStroke = []; // Cancel any single-tap paint

      const pts = Array.from(this.activePointers.values());
      this.lastPinchDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      this.lastPinchMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      return;
    }

    if (this.activePointers.size > 2) return;

    this.isPointerDown = true;
    this.pointerButton = e.button;

    const rect = this.viewportEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { wx, wy } = this.editor.camera.screenToWorld(screenX, screenY);

    // Pan with Middle Click, Space + Left Click, or Pan tool
    if (e.button === 1 || (e.button === 0 && this.isSpacePressed) || this.activeTool === 'pan') {
      this.editor.camera.isDragging = true;
      this.editor.camera.lastPointerX = e.clientX;
      this.editor.camera.lastPointerY = e.clientY;
      this.viewportEl.classList.add('is-panning');
      return;
    }

    // Right Click quick cancels or eyedropper / clear
    if (e.button === 2) {
      if (this.activeTool === 'select') {
        this.editor.objectManager.clearSelection();
        this.editor.ui.updateInspector(null);
      }
      return;
    }

    // If Test Player Mode is active, clicking spawns or repositions player
    if (this.editor.objectManager.playerMode) {
      this.editor.objectManager.playerData.x = wx;
      this.editor.objectManager.playerData.y = wy;
      if (this.editor.objectManager.playerSprite) {
        this.editor.objectManager.playerSprite.position.set(wx, wy);
        this.editor.objectLayer.depthSorter.sortEntity(this.editor.objectManager.playerSprite);
      }
      return;
    }

    // Tool actions
    switch (this.activeTool) {
      case 'brush': {
        this.currentTileStroke = [];
        this.lastPaintedTile = null;
        this.paintTileAt(wx, wy);
        break;
      }

      case 'bucket': {
        this.floodFillAt(wx, wy);
        break;
      }

      case 'eraser': {
        this.eraseAt(wx, wy);
        break;
      }

      case 'object_place': {
        this.editor.objectManager.placeObject(this.selectedObjectAsset, wx, wy, {
          snapToGrid: this.isShiftPressed
        });
        break;
      }

      case 'object_brush': {
        this.editor.objectManager.paintObjectBrush(this.selectedObjectAsset, wx, wy);
        break;
      }

      case 'select': {
        this.handleSelectPointerDown(wx, wy);
        break;
      }
    }
  }

  onPointerMove(e) {
    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const rect = this.viewportEl.getBoundingClientRect();

    // Multi-touch Pinch-to-Zoom and 2-Finger Pan
    if (this.isPinching && this.activePointers.size >= 2) {
      const pts = Array.from(this.activePointers.values());
      const currentDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const currentMid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

      if (this.lastPinchDist && currentDist > 0) {
        const deltaDist = currentDist - this.lastPinchDist;
        if (Math.abs(deltaDist) > 1.5) {
          const zoomDelta = -deltaDist * 1.5;
          this.editor.camera.zoomAt(zoomDelta, currentMid.x - rect.left, currentMid.y - rect.top);
          this.lastPinchDist = currentDist;
        }
      }

      if (this.lastPinchMid) {
        const dx = currentMid.x - this.lastPinchMid.x;
        const dy = currentMid.y - this.lastPinchMid.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          this.editor.camera.pan(dx, dy);
          this.lastPinchMid = currentMid;
        }
      }
      return;
    }

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { wx, wy } = this.editor.camera.screenToWorld(screenX, screenY);

    // Update Status Bar info
    const { tx, ty } = this.editor.map.worldToTile(wx, wy);
    const { chunkX, chunkY } = this.editor.map.tileToChunk(tx, ty);
    this.editor.ui.updateCoordinates(Math.round(wx), Math.round(wy), tx, ty, chunkX, chunkY);

    // Camera Panning
    if (this.editor.camera.isDragging) {
      const dx = e.clientX - this.editor.camera.lastPointerX;
      const dy = e.clientY - this.editor.camera.lastPointerY;
      this.editor.camera.lastPointerX = e.clientX;
      this.editor.camera.lastPointerY = e.clientY;
      this.editor.camera.pan(dx, dy);
      return;
    }

    if (!this.isPointerDown) return;

    // Active tool dragging
    if (this.activeTool === 'brush') {
      this.paintTileAt(wx, wy);
    } else if (this.activeTool === 'eraser') {
      this.eraseAt(wx, wy);
    } else if (this.activeTool === 'object_brush') {
      this.editor.objectManager.paintObjectBrush(this.selectedObjectAsset, wx, wy);
    } else if (this.activeTool === 'select' && this.isDraggingObject) {
      this.handleObjectDrag(wx, wy);
    }
  }

  onPointerUp(e) {
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size < 2) {
      this.isPinching = false;
      this.lastPinchDist = null;
      this.lastPinchMid = null;
    }

    if (this.editor.camera.isDragging) {
      this.editor.camera.isDragging = false;
      this.viewportEl.classList.remove('is-panning');
    }

    if (this.isPointerDown) {
      // Commit tile stroke to history
      if (this.activeTool === 'brush' && this.currentTileStroke.length > 0) {
        this.editor.history.push({
          type: 'TILES_PAINT',
          tiles: [...this.currentTileStroke]
        });
        this.currentTileStroke = [];
      }

      // Commit object drag / transform to history
      if (this.isDraggingObject && this.dragObjectInitialState) {
        const currentObj = this.editor.objectManager.getSelectedObject();
        if (currentObj && (currentObj.x !== this.dragObjectInitialState.x || currentObj.y !== this.dragObjectInitialState.y)) {
          this.editor.history.push({
            type: 'OBJECT_TRANSFORM',
            oldState: { ...this.dragObjectInitialState },
            newState: { ...currentObj }
          });
        }
        this.isDraggingObject = false;
        this.dragObjectInitialState = null;
      }

      this.isPointerDown = false;
    }
  }

  onPointerCancel(e) {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size < 2) {
      this.isPinching = false;
    }
    this.isPointerDown = false;
    this.editor.camera.isDragging = false;
    this.viewportEl.classList.remove('is-panning');
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.viewportEl.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    this.editor.camera.zoomAt(e.deltaY, screenX, screenY);
  }

  paintTileAt(wx, wy) {
    const { tx, ty } = this.editor.map.worldToTile(wx, wy);
    if (!this.editor.map.isInBounds(tx, ty)) return;

    const key = `${tx},${ty}`;
    if (this.lastPaintedTile === key) return;
    this.lastPaintedTile = key;

    const prevTile = this.editor.map.getTile(tx, ty);
    if (prevTile === this.selectedTerrain) return;

    this.editor.map.setTile(tx, ty, this.selectedTerrain);
    this.editor.terrainLayer.updateTile(tx, ty, this.selectedTerrain);

    this.currentTileStroke.push({
      x: tx,
      y: ty,
      prev: prevTile,
      next: this.selectedTerrain
    });
  }

  floodFillAt(wx, wy) {
    const { tx, ty } = this.editor.map.worldToTile(wx, wy);
    const changed = this.editor.map.floodFill(tx, ty, this.selectedTerrain);
    if (changed.length > 0) {
      this.editor.terrainLayer.updateTiles(changed);
      this.editor.history.push({
        type: 'TILES_PAINT',
        tiles: changed
      });
    }
  }

  eraseAt(wx, wy) {
    // Try erasing an object first
    const objRemoved = this.editor.objectManager.deleteObjectAt(wx, wy);
    if (!objRemoved && this.isAltPressed) {
      // If Alt is held, erase/reset terrain tile to default
      const { tx, ty } = this.editor.map.worldToTile(wx, wy);
      const prev = this.editor.map.getTile(tx, ty);
      const defaultTile = this.editor.map.defaultTerrain;
      if (prev !== defaultTile) {
        this.editor.map.setTile(tx, ty, defaultTile);
        this.editor.terrainLayer.updateTile(tx, ty, defaultTile);
        this.editor.history.push({
          type: 'TILES_PAINT',
          tiles: [{ x: tx, y: ty, prev, next: defaultTile }]
        });
      }
    }
  }

  handleSelectPointerDown(wx, wy) {
    // Check if clicked an object
    const obj = this.editor.map.findObjectAt(wx, wy, this.editor.assetManager);
    if (obj) {
      this.editor.objectManager.selectObject(obj.id);
      this.editor.ui.updateInspector(obj);

      this.isDraggingObject = true;
      this.dragStartWorld = { x: wx, y: wy };
      this.dragObjectInitialState = { ...obj };
    } else {
      this.editor.objectManager.clearSelection();
      this.editor.ui.updateInspector(null);
    }
  }

  handleObjectDrag(wx, wy) {
    const obj = this.editor.objectManager.getSelectedObject();
    if (!obj || !this.dragObjectInitialState) return;

    const dx = wx - this.dragStartWorld.x;
    const dy = wy - this.dragStartWorld.y;

    let nextX = Math.round(this.dragObjectInitialState.x + dx);
    let nextY = Math.round(this.dragObjectInitialState.y + dy);

    if (this.isShiftPressed) {
      // Snap to tile
      const ts = this.editor.map.tileSize;
      nextX = Math.floor(nextX / ts) * ts + ts / 2;
      nextY = Math.floor(nextY / ts) * ts + ts;
    }

    this.editor.objectManager.updateSelectedTransform({ x: nextX, y: nextY });
    this.editor.ui.updateInspector(obj);
  }

  onKeyDown(e) {
    // Check if typing in an input field or modal
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    this.isSpacePressed = e.code === 'Space';
    this.isShiftPressed = e.shiftKey;
    this.isAltPressed = e.altKey;
    this.isCtrlPressed = e.ctrlKey || e.metaKey;

    // Track Player keys (WASD / Arrows)
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
      if (key === 'w' || key === 'arrowup') this.editor.objectManager.playerKeys.w = true;
      if (key === 's' || key === 'arrowdown') this.editor.objectManager.playerKeys.s = true;
      if (key === 'a' || key === 'arrowleft') this.editor.objectManager.playerKeys.a = true;
      if (key === 'd' || key === 'arrowright') this.editor.objectManager.playerKeys.d = true;
    }

    // Keyboard Shortcuts
    if (this.isCtrlPressed) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.editor.history.redo(this.editor);
        } else {
          this.editor.history.undo(this.editor);
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        this.editor.history.redo(this.editor);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.editor.saveMapJSON();
      }
      return;
    }

    // Single Key Tool Shortcuts
    switch (e.key.toLowerCase()) {
      case 'b':
        this.setTool('brush');
        break;
      case 'f':
        this.setTool('bucket');
        break;
      case 'e':
        this.setTool('eraser');
        break;
      case 'o':
        this.setTool('object_place');
        break;
      case 'r':
        this.setTool('object_brush');
        break;
      case 'v':
        this.setTool('select');
        break;
      case 'h':
        this.setTool('pan');
        break;
      case 'g':
        this.editor.toggleGrid();
        break;
      case 'c':
        this.editor.toggleCollisions();
        break;
      case 'a':
        this.editor.toggleAnchors();
        break;
      case 'y':
        this.editor.toggleDepthLines();
        break;
      case 'p':
        this.editor.togglePlayerMode();
        break;
      case 'delete':
      case 'backspace':
        this.editor.objectManager.deleteSelected();
        this.editor.ui.updateInspector(null);
        break;
    }
  }

  onKeyUp(e) {
    if (e.code === 'Space') this.isSpacePressed = false;
    this.isShiftPressed = e.shiftKey;
    this.isAltPressed = e.altKey;
    this.isCtrlPressed = e.ctrlKey || e.metaKey;

    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') this.editor.objectManager.playerKeys.w = false;
    if (key === 's' || key === 'arrowdown') this.editor.objectManager.playerKeys.s = false;
    if (key === 'a' || key === 'arrowleft') this.editor.objectManager.playerKeys.a = false;
    if (key === 'd' || key === 'arrowright') this.editor.objectManager.playerKeys.d = false;
  }
}
