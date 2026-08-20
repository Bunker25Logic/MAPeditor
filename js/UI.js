/**
 * UI.js
 * Manages the dark-themed user interface, asset palettes, inspector panel,
 * dropdown menus, modals, and status bar synchronization.
 */

export class UI {
  constructor(editor) {
    this.editor = editor;
    this.activeTab = 'terrain'; // 'terrain' | 'objects'

    this.dom = {
      // Palettes
      terrainPalette: document.getElementById('terrain-palette-grid'),
      objectsPalette: document.getElementById('objects-palette-grid'),
      tabTerrain: document.getElementById('tab-terrain'),
      tabObjects: document.getElementById('tab-objects'),

      // Custom file upload
      fileInputTerrain: document.getElementById('upload-terrain-input'),
      fileInputObject: document.getElementById('upload-object-input'),

      // Status Bar
      statusCoords: document.getElementById('status-coords'),
      statusTile: document.getElementById('status-tile'),
      statusChunk: document.getElementById('status-chunk'),
      statusZoom: document.getElementById('status-zoom'),
      statusTool: document.getElementById('status-tool'),
      statusObjectsCount: document.getElementById('status-objects-count'),
      statusFps: document.getElementById('status-fps'),

      // Inspector
      inspectorEmpty: document.getElementById('inspector-empty'),
      inspectorContent: document.getElementById('inspector-content'),
      inpObjId: document.getElementById('prop-obj-id'),
      inpObjAsset: document.getElementById('prop-obj-asset'),
      inpObjX: document.getElementById('prop-obj-x'),
      inpObjY: document.getElementById('prop-obj-y'),
      inpObjScaleX: document.getElementById('prop-obj-scalex'),
      inpObjScaleY: document.getElementById('prop-obj-scaley'),
      inpObjRot: document.getElementById('prop-obj-rot'),
      inpObjAnchorX: document.getElementById('prop-obj-anchorx'),
      inpObjAnchorY: document.getElementById('prop-obj-anchory'),
      inpObjCollision: document.getElementById('prop-obj-collision'),
      btnDeleteSelected: document.getElementById('btn-delete-selected'),
      hierarchyList: document.getElementById('hierarchy-list'),

      // Brush settings
      sliderDensity: document.getElementById('brush-density-slider'),
      valDensity: document.getElementById('brush-density-val'),
      sliderScaleMin: document.getElementById('brush-scale-min'),
      sliderScaleMax: document.getElementById('brush-scale-max'),

      // Toolbar Buttons
      toolBtns: document.querySelectorAll('.tool-btn[data-tool]'),
      btnUndo: document.getElementById('btn-undo'),
      btnRedo: document.getElementById('btn-redo'),
      btnGrid: document.getElementById('btn-toggle-grid'),
      btnCollision: document.getElementById('btn-toggle-collision'),
      btnPlayerMode: document.getElementById('btn-player-mode'),
      playerModeHud: document.getElementById('player-mode-hud'),

      // Modals
      modalBackdrop: document.getElementById('modal-backdrop'),
      modalTitle: document.getElementById('modal-title'),
      modalBody: document.getElementById('modal-body'),
      modalFooter: document.getElementById('modal-footer'),
      modalCloseBtn: document.getElementById('modal-close-btn'),

      // Mobile Drawers & Backdrops
      sidebarLeft: document.getElementById('sidebar-left'),
      sidebarRight: document.getElementById('sidebar-right'),
      drawerBackdrop: document.getElementById('drawer-backdrop'),
      btnMobilePalette: document.getElementById('btn-mobile-palette'),
      btnMobileInspector: document.getElementById('btn-mobile-inspector'),
      btnCloseSidebarLeft: document.getElementById('btn-close-sidebar-left'),
      btnCloseSidebarRight: document.getElementById('btn-close-sidebar-right'),

      // Virtual Mobile D-Pad
      virtualDpad: document.getElementById('virtual-dpad-container'),
      dpadBtns: document.querySelectorAll('.dpad-btn[data-dir]'),
      dpadExitBtn: document.getElementById('dpad-exit-btn')
    };

    this.bindEvents();
  }

  init() {
    this.renderTerrainPalette();
    this.renderObjectsPalette();
    this.updateHierarchyList();
    this.updateActiveTool(this.editor.inputManager.activeTool);
  }

  bindEvents() {
    // Tab switching
    this.dom.tabTerrain.addEventListener('click', () => this.switchTab('terrain'));
    this.dom.tabObjects.addEventListener('click', () => this.switchTab('objects'));

    // Toolbar Tool buttons
    this.dom.toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.getAttribute('data-tool');
        this.editor.inputManager.setTool(tool);
      });
    });

    // Undo / Redo buttons
    if (this.dom.btnUndo) {
      this.dom.btnUndo.addEventListener('click', () => this.editor.history.undo(this.editor));
    }
    if (this.dom.btnRedo) {
      this.dom.btnRedo.addEventListener('click', () => this.editor.history.redo(this.editor));
    }

    // View toggles
    if (this.dom.btnGrid) {
      this.dom.btnGrid.addEventListener('click', () => this.editor.toggleGrid());
    }
    if (this.dom.btnCollision) {
      this.dom.btnCollision.addEventListener('click', () => this.editor.toggleCollisions());
    }
    if (this.dom.btnPlayerMode) {
      this.dom.btnPlayerMode.addEventListener('click', () => this.editor.togglePlayerMode());
    }

    // Custom File Uploads
    if (this.dom.fileInputTerrain) {
      this.dom.fileInputTerrain.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const res = await this.editor.assetManager.loadCustomImage(file, 'terrain');
          this.renderTerrainPalette();
          this.selectTerrain(res.id);
        }
      });
    }

    if (this.dom.fileInputObject) {
      this.dom.fileInputObject.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const res = await this.editor.assetManager.loadCustomImage(file, 'object');
          this.renderObjectsPalette();
          this.selectObjectAsset(res.id);
        }
      });
    }

    // Inspector Inputs Live Binding & Atomic History Commit
    let inspectorInitialState = null;

    const parseNumeric = (val, fallback) => {
      const num = Number(val);
      return Number.isFinite(num) ? num : fallback;
    };

    const updateObjFromInputs = () => {
      const selected = this.editor.objectManager.getSelectedObject();
      if (!selected) return;

      if (!inspectorInitialState) {
        inspectorInitialState = { ...selected };
      }

      const rotDeg = Number(this.dom.inpObjRot.value);
      const changes = {
        x: parseNumeric(this.dom.inpObjX.value, selected.x),
        y: parseNumeric(this.dom.inpObjY.value, selected.y),
        scaleX: parseNumeric(this.dom.inpObjScaleX.value, selected.scaleX),
        scaleY: parseNumeric(this.dom.inpObjScaleY.value, selected.scaleY),
        rotation: Number.isFinite(rotDeg) ? (rotDeg * Math.PI) / 180 : selected.rotation,
        anchorX: parseNumeric(this.dom.inpObjAnchorX.value, selected.anchorX),
        anchorY: parseNumeric(this.dom.inpObjAnchorY.value, selected.anchorY),
        collision: Boolean(this.dom.inpObjCollision.checked)
      };

      this.editor.objectManager.updateSelectedTransform(changes);
    };

    const commitInspectorChanges = () => {
      const selected = this.editor.objectManager.getSelectedObject();
      if (selected && inspectorInitialState && this.editor.history) {
        const hasChanged = 
          inspectorInitialState.x !== selected.x ||
          inspectorInitialState.y !== selected.y ||
          inspectorInitialState.scaleX !== selected.scaleX ||
          inspectorInitialState.scaleY !== selected.scaleY ||
          inspectorInitialState.rotation !== selected.rotation ||
          inspectorInitialState.anchorX !== selected.anchorX ||
          inspectorInitialState.anchorY !== selected.anchorY ||
          inspectorInitialState.collision !== selected.collision;

        if (hasChanged) {
          this.editor.history.push({
            type: 'OBJECT_TRANSFORM',
            oldState: { ...inspectorInitialState },
            newState: { ...selected }
          });
        }
      }
      inspectorInitialState = null;
    };

    [
      this.dom.inpObjX,
      this.dom.inpObjY,
      this.dom.inpObjScaleX,
      this.dom.inpObjScaleY,
      this.dom.inpObjRot,
      this.dom.inpObjAnchorX,
      this.dom.inpObjAnchorY
    ].forEach(inp => {
      if (inp) {
        inp.addEventListener('focus', () => {
          const selected = this.editor.objectManager.getSelectedObject();
          if (selected) inspectorInitialState = { ...selected };
        });
        inp.addEventListener('input', updateObjFromInputs);
        inp.addEventListener('blur', commitInspectorChanges);
      }
    });

    if (this.dom.inpObjCollision) {
      this.dom.inpObjCollision.addEventListener('change', () => {
        const selected = this.editor.objectManager.getSelectedObject();
        if (selected) inspectorInitialState = { ...selected };
        updateObjFromInputs();
        commitInspectorChanges();
      });
    }

    if (this.dom.btnDeleteSelected) {
      this.dom.btnDeleteSelected.addEventListener('click', () => {
        this.editor.objectManager.deleteSelected();
        this.updateInspector(null);
        this.updateHierarchyList();
      });
    }

    // Brush scatter sliders
    if (this.dom.sliderDensity) {
      this.dom.sliderDensity.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.editor.objectManager.brushConfig.density = val;
        this.dom.valDensity.textContent = `${Math.round(val * 100)}%`;
      });
    }

    if (this.dom.sliderScaleMin) {
      this.dom.sliderScaleMin.addEventListener('input', (e) => {
        this.editor.objectManager.brushConfig.scaleMin = parseFloat(e.target.value);
      });
    }

    if (this.dom.sliderScaleMax) {
      this.dom.sliderScaleMax.addEventListener('input', (e) => {
        this.editor.objectManager.brushConfig.scaleMax = parseFloat(e.target.value);
      });
    }

    // Modal Close
    this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
    this.dom.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.dom.modalBackdrop) this.closeModal();
    });

    // Mobile Drawers & Backdrops
    if (this.dom.btnMobilePalette) {
      this.dom.btnMobilePalette.addEventListener('click', () => this.openDrawerLeft());
    }
    if (this.dom.btnMobileInspector) {
      this.dom.btnMobileInspector.addEventListener('click', () => this.openDrawerRight());
    }
    if (this.dom.btnCloseSidebarLeft) {
      this.dom.btnCloseSidebarLeft.addEventListener('click', () => this.closeDrawers());
    }
    if (this.dom.btnCloseSidebarRight) {
      this.dom.btnCloseSidebarRight.addEventListener('click', () => this.closeDrawers());
    }
    if (this.dom.drawerBackdrop) {
      this.dom.drawerBackdrop.addEventListener('click', () => this.closeDrawers());
    }

    // Virtual D-Pad Touch & Click Handling for Mobile Player Mode
    if (this.dom.dpadBtns) {
      this.dom.dpadBtns.forEach(btn => {
        const dir = btn.getAttribute('data-dir');
        const press = (e) => {
          e.preventDefault();
          e.stopPropagation();
          btn.classList.add('pressed');
          this.editor.objectManager.playerKeys[dir] = true;
        };
        const release = (e) => {
          e.preventDefault();
          btn.classList.remove('pressed');
          this.editor.objectManager.playerKeys[dir] = false;
        };

        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('pointerleave', release);
      });
    }

    if (this.dom.dpadExitBtn) {
      this.dom.dpadExitBtn.addEventListener('click', () => {
        this.editor.togglePlayerMode();
      });
    }

    // Setup Top Menu dropdowns
    this.setupDropdownMenus();
  }

  openDrawerLeft() {
    if (this.dom.sidebarRight) this.dom.sidebarRight.classList.remove('open');
    if (this.dom.sidebarLeft) this.dom.sidebarLeft.classList.add('open');
    if (this.dom.drawerBackdrop) this.dom.drawerBackdrop.classList.add('active');
  }

  openDrawerRight() {
    if (this.dom.sidebarLeft) this.dom.sidebarLeft.classList.remove('open');
    if (this.dom.sidebarRight) this.dom.sidebarRight.classList.add('open');
    if (this.dom.drawerBackdrop) this.dom.drawerBackdrop.classList.add('active');
  }

  closeDrawers() {
    if (this.dom.sidebarLeft) this.dom.sidebarLeft.classList.remove('open');
    if (this.dom.sidebarRight) this.dom.sidebarRight.classList.remove('open');
    if (this.dom.drawerBackdrop) this.dom.drawerBackdrop.classList.remove('active');
  }

  setupDropdownMenus() {
    const dropdowns = document.querySelectorAll('.menu-dropdown');
    dropdowns.forEach(drop => {
      const btn = drop.querySelector('.menu-btn');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdowns.forEach(d => { if (d !== drop) d.classList.remove('open'); });
        drop.classList.toggle('open');
      });
    });

    window.addEventListener('click', () => {
      dropdowns.forEach(d => d.classList.remove('open'));
    });

    // Dropdown Action items
    const bindAction = (id, handler) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdowns.forEach(d => d.classList.remove('open'));
          handler();
        });
      }
    };

    bindAction('menu-action-new', () => this.showNewMapModal());
    bindAction('menu-action-open-json', () => this.showImportJSONModal());
    bindAction('menu-action-save-json', () => this.editor.saveMapJSON());
    bindAction('menu-action-export-png', () => this.editor.exportPNG());

    bindAction('menu-action-undo', () => this.editor.history.undo(this.editor));
    bindAction('menu-action-redo', () => this.editor.history.redo(this.editor));
    bindAction('menu-action-clear-objects', () => this.editor.clearAllObjects());
    bindAction('menu-action-fill-terrain', () => this.showFillTerrainModal());

    bindAction('menu-action-gen-forest', () => {
      this.editor.generateForest();
      this.updateHierarchyList();
    });
    bindAction('menu-action-gen-rocks', () => {
      this.editor.generateRocks();
      this.updateHierarchyList();
    });

    bindAction('menu-action-grid', () => this.editor.toggleGrid());
    bindAction('menu-action-collision', () => this.editor.toggleCollisions());
    bindAction('menu-action-anchors', () => this.editor.toggleAnchors());
    bindAction('menu-action-depthlines', () => this.editor.toggleDepthLines());
    bindAction('menu-action-player', () => this.editor.togglePlayerMode());
    bindAction('menu-action-center', () => this.editor.camera.centerOnMap());
    bindAction('menu-action-help', () => this.showShortcutsModal());
  }

  switchTab(tab) {
    this.activeTab = tab;
    if (tab === 'terrain') {
      this.dom.tabTerrain.classList.add('active');
      this.dom.tabObjects.classList.remove('active');
      this.dom.terrainPalette.style.display = 'grid';
      this.dom.objectsPalette.style.display = 'none';
      if (['object_place', 'object_brush', 'select'].includes(this.editor.inputManager.activeTool)) {
        this.editor.inputManager.setTool('brush');
      }
    } else {
      this.dom.tabObjects.classList.add('active');
      this.dom.tabTerrain.classList.remove('active');
      this.dom.terrainPalette.style.display = 'none';
      this.dom.objectsPalette.style.display = 'grid';
      if (['brush', 'bucket'].includes(this.editor.inputManager.activeTool)) {
        this.editor.inputManager.setTool('object_place');
      }
    }
  }

  renderTerrainPalette() {
    this.dom.terrainPalette.innerHTML = '';
    const terrains = this.editor.assetManager.getAllTerrains();

    terrains.forEach(t => {
      const card = document.createElement('div');
      card.className = `asset-card ${this.editor.inputManager.selectedTerrain === t.id ? 'active' : ''}`;
      card.id = `palette-terrain-${t.id}`;

      const preview = document.createElement('div');
      preview.className = 'asset-preview-container';
      preview.appendChild(t.canvas);

      const label = document.createElement('div');
      label.className = 'asset-label';
      label.textContent = t.name;

      const badge = document.createElement('div');
      badge.className = 'asset-size-badge';
      badge.textContent = `${t.tileWidth}x${t.tileHeight} px`;

      card.appendChild(preview);
      card.appendChild(label);
      card.appendChild(badge);

      card.addEventListener('click', () => this.selectTerrain(t.id));
      this.dom.terrainPalette.appendChild(card);
    });
  }

  selectTerrain(id) {
    this.editor.inputManager.selectedTerrain = id;
    document.querySelectorAll('#terrain-palette-grid .asset-card').forEach(c => c.classList.remove('active'));
    const active = document.getElementById(`palette-terrain-${id}`);
    if (active) active.classList.add('active');

    if (this.editor.inputManager.activeTool !== 'brush' && this.editor.inputManager.activeTool !== 'bucket') {
      this.editor.inputManager.setTool('brush');
    }

    if (window.innerWidth <= 820) {
      this.closeDrawers();
    }
  }

  renderObjectsPalette() {
    this.dom.objectsPalette.innerHTML = '';
    const objects = this.editor.assetManager.getAllObjects();

    objects.forEach(obj => {
      const card = document.createElement('div');
      card.className = `asset-card ${this.editor.inputManager.selectedObjectAsset === obj.id ? 'active' : ''}`;
      card.id = `palette-obj-${obj.id}`;

      const preview = document.createElement('div');
      preview.className = 'asset-preview-container';
      preview.appendChild(obj.canvas);

      const label = document.createElement('div');
      label.className = 'asset-label';
      label.textContent = obj.name;

      const badge = document.createElement('div');
      badge.className = 'asset-size-badge';
      badge.textContent = `${obj.width}x${obj.height} px`;

      card.appendChild(preview);
      card.appendChild(label);
      card.appendChild(badge);

      card.addEventListener('click', () => this.selectObjectAsset(obj.id));
      this.dom.objectsPalette.appendChild(card);
    });
  }

  selectObjectAsset(id) {
    this.editor.inputManager.selectedObjectAsset = id;
    document.querySelectorAll('#objects-palette-grid .asset-card').forEach(c => c.classList.remove('active'));
    const active = document.getElementById(`palette-obj-${id}`);
    if (active) active.classList.add('active');

    if (this.editor.inputManager.activeTool !== 'object_place' && this.editor.inputManager.activeTool !== 'object_brush') {
      this.editor.inputManager.setTool('object_place');
    }

    if (window.innerWidth <= 820) {
      this.closeDrawers();
    }
  }

  updateActiveTool(tool) {
    this.dom.toolBtns.forEach(btn => {
      if (btn.getAttribute('data-tool') === tool) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const toolNames = {
      brush: 'Pincel de Terreno (B)',
      bucket: 'Balde de Tinta (F)',
      eraser: 'Borracha (E)',
      object_place: 'Colocar Objeto (O)',
      object_brush: 'Pincel de Objetos (R)',
      select: 'Selecionar / Mover (V)',
      pan: 'Mover Câmera (H)'
    };
    if (this.dom.statusTool) {
      this.dom.statusTool.textContent = toolNames[tool] || tool;
    }
  }

  updateInspector(selectedObject) {
    if (!selectedObject) {
      this.dom.inspectorEmpty.style.display = 'block';
      this.dom.inspectorContent.style.display = 'none';
      return;
    }

    this.dom.inspectorEmpty.style.display = 'none';
    this.dom.inspectorContent.style.display = 'block';

    const def = this.editor.assetManager.getObjectDef(selectedObject.asset);

    this.dom.inpObjId.textContent = selectedObject.id;
    this.dom.inpObjAsset.textContent = `${def ? def.name : selectedObject.asset} (${def ? def.width : 0}x${def ? def.height : 0}px)`;
    this.dom.inpObjX.value = Math.round(selectedObject.x);
    this.dom.inpObjY.value = Math.round(selectedObject.y);
    this.dom.inpObjScaleX.value = Number(selectedObject.scaleX).toFixed(2);
    this.dom.inpObjScaleY.value = Number(selectedObject.scaleY).toFixed(2);
    this.dom.inpObjRot.value = Math.round((selectedObject.rotation * 180) / Math.PI);
    this.dom.inpObjAnchorX.value = Number(selectedObject.anchorX).toFixed(2);
    this.dom.inpObjAnchorY.value = Number(selectedObject.anchorY).toFixed(2);
    this.dom.inpObjCollision.checked = Boolean(selectedObject.collision);
  }

  updateHierarchyList() {
    this.dom.hierarchyList.innerHTML = '';
    const objects = this.editor.map.objects;
    const selectedId = this.editor.objectManager.selectedObjectId;

    if (this.dom.statusObjectsCount) {
      const vis = this.editor.objectLayer ? this.editor.objectLayer.visibleObjectsCount : objects.length;
      const tot = objects.length;
      this.dom.statusObjectsCount.textContent = tot > 0 ? `${vis}/${tot}` : '0';
    }

    // Render sorted list
    objects.slice().reverse().forEach(obj => {
      const def = this.editor.assetManager.getObjectDef(obj.asset);
      const item = document.createElement('div');
      item.className = `hierarchy-item ${selectedId === obj.id ? 'active' : ''}`;
      item.id = `hierarchy-item-${obj.id}`;

      item.innerHTML = `
        <span>${def ? def.name : obj.asset}</span>
        <span style="font-family: monospace; font-size: 10px; color: var(--text-dim);">(${Math.round(obj.x)}, ${Math.round(obj.y)})</span>
      `;

      item.addEventListener('click', () => {
        this.editor.inputManager.setTool('select');
        this.editor.objectManager.selectObject(obj.id);
        this.updateInspector(obj);
        this.updateHierarchyList();
      });

      this.dom.hierarchyList.appendChild(item);
    });
  }

  updateCoordinates(wx, wy, tx, ty, chunkX, chunkY) {
    if (this.dom.statusCoords) this.dom.statusCoords.textContent = `X: ${wx}  Y: ${wy}`;
    if (this.dom.statusTile) this.dom.statusTile.textContent = `Tile: [${tx}, ${ty}]`;
    if (this.dom.statusChunk) this.dom.statusChunk.textContent = `Chunk: [${chunkX}, ${chunkY}]`;
  }

  updateZoom(zoomPercent) {
    if (this.dom.statusZoom) {
      this.dom.statusZoom.textContent = `${Math.round(zoomPercent * 100)}%`;
    }
  }

  updateHistoryButtons(canUndo, canRedo) {
    if (this.dom.btnUndo) this.dom.btnUndo.disabled = !canUndo;
    if (this.dom.btnRedo) this.dom.btnRedo.disabled = !canRedo;
  }

  updatePlayerHUD(active) {
    if (active) {
      this.dom.playerModeHud.classList.add('visible');
      this.dom.btnPlayerMode.classList.add('active');
      if (this.dom.virtualDpad) this.dom.virtualDpad.classList.add('visible');
    } else {
      this.dom.playerModeHud.classList.remove('visible');
      this.dom.btnPlayerMode.classList.remove('active');
      if (this.dom.virtualDpad) this.dom.virtualDpad.classList.remove('visible');
    }
  }

  /* =========================================================================
     MODALS
     ========================================================================= */

  openModal(title, contentHtml, footerHtml) {
    this.dom.modalTitle.textContent = title;
    this.dom.modalBody.innerHTML = contentHtml;
    this.dom.modalFooter.innerHTML = footerHtml;
    this.dom.modalBackdrop.classList.add('open');
  }

  closeModal() {
    this.dom.modalBackdrop.classList.remove('open');
  }

  showNewMapModal() {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="color: var(--text-muted);">Configure as dimensões do novo mapa para seu MMO:</p>
        <div class="prop-row">
          <span class="prop-label">Largura (Tiles):</span>
          <input id="new-map-width" type="number" class="prop-input" value="64" min="16" max="256">
        </div>
        <div class="prop-row">
          <span class="prop-label">Altura (Tiles):</span>
          <input id="new-map-height" type="number" class="prop-input" value="64" min="16" max="256">
        </div>
        <div class="prop-row">
          <span class="prop-label">Tamanho do Tile (px):</span>
          <input id="new-map-tilesize" type="number" class="prop-input" value="32" readonly style="opacity: 0.7;">
        </div>
        <div class="prop-row">
          <span class="prop-label">Terreno Inicial:</span>
          <select id="new-map-terrain" class="prop-input wide">
            <option value="grass">Grama</option>
            <option value="dirt">Terra</option>
            <option value="sand">Areia</option>
            <option value="stone">Pedra</option>
            <option value="snow">Neve</option>
            <option value="water">Água</option>
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn-pill" id="modal-cancel-btn">Cancelar</button>
      <button class="btn-pill primary" id="modal-create-map-btn">Criar Novo Mapa</button>
    `;

    this.openModal('Novo Mapa MMO', content, footer);

    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-create-map-btn').addEventListener('click', () => {
      let rawW = parseInt(document.getElementById('new-map-width').value, 10);
      let rawH = parseInt(document.getElementById('new-map-height').value, 10);
      
      const w = Number.isInteger(rawW) ? Math.max(16, Math.min(rawW, 512)) : 64;
      const h = Number.isInteger(rawH) ? Math.max(16, Math.min(rawH, 512)) : 64;
      const terrain = document.getElementById('new-map-terrain').value || 'grass';
      
      this.editor.createNewMap(w, h, terrain);
      this.closeModal();
    });
  }

  showImportJSONModal() {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="color: var(--text-muted);">Selecione um arquivo .json de mapa salvo ou cole o JSON abaixo:</p>
        <input type="file" id="modal-import-file" accept=".json" class="btn-pill" style="margin-bottom: 8px;">
        <textarea id="modal-json-text" class="modal-textarea" placeholder="Cole o JSON do mapa aqui..."></textarea>
      </div>
    `;

    const footer = `
      <button class="btn-pill" id="modal-cancel-btn">Cancelar</button>
      <button class="btn-pill primary" id="modal-load-json-btn">Carregar Mapa</button>
    `;

    this.openModal('Importar Mapa JSON', content, footer);

    document.getElementById('modal-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('modal-json-text').value = ev.target.result;
        };
        reader.readAsText(file);
      }
    });

    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-load-json-btn').addEventListener('click', () => {
      const text = document.getElementById('modal-json-text').value.trim();
      if (text) {
        try {
          this.editor.loadMapJSON(text);
          this.closeModal();
        } catch (err) {
          alert('Erro ao processar JSON: ' + err.message);
        }
      }
    });
  }

  showFillTerrainModal() {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <p style="color: var(--text-muted);">Selecione o terreno para preencher todo o mapa:</p>
        <div class="prop-row">
          <span class="prop-label">Terreno:</span>
          <select id="modal-fill-terrain" class="prop-input wide">
            <option value="grass">Grama</option>
            <option value="dirt">Terra</option>
            <option value="sand">Areia</option>
            <option value="stone">Pedra</option>
            <option value="snow">Neve</option>
            <option value="water">Água</option>
            <option value="wood_floor">Madeira / Piso</option>
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn-pill" id="modal-cancel-btn">Cancelar</button>
      <button class="btn-pill primary" id="modal-apply-fill-btn">Preencher Todo o Terreno</button>
    `;

    this.openModal('Preencher Terreno', content, footer);

    document.getElementById('modal-cancel-btn').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-apply-fill-btn').addEventListener('click', () => {
      const terrain = document.getElementById('modal-fill-terrain').value;
      this.editor.fillAllTerrain(terrain);
      this.closeModal();
    });
  }

  showShortcutsModal() {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 8px; color: var(--text-main); font-size: 12px;">
        <div style="font-weight: 700; color: var(--accent); margin-bottom: 4px; text-transform: uppercase; font-size: 11px;">📱 Controles Touch & Mobile</div>
        <div class="prop-row"><span>Zoom (Pinça):</span><kbd class="btn-pill">Pinch 2 Dedos</kbd></div>
        <div class="prop-row"><span>Mover Câmera (Pan):</span><kbd class="btn-pill">Arrastar com 2 Dedos</kbd></div>
        <div class="prop-row"><span>Pintar / Colocar:</span><kbd class="btn-pill">Toque com 1 Dedo</kbd></div>
        <div class="prop-row"><span>Andar no Modo Jogador:</span><kbd class="btn-pill">D-Pad Touch na Tela</kbd></div>
        <div class="prop-row"><span>Abrir Gavetas:</span><kbd class="btn-pill">Botões Paleta / Inspetor no Topo</kbd></div>

        <div style="font-weight: 700; color: var(--accent); margin-top: 8px; margin-bottom: 4px; text-transform: uppercase; font-size: 11px;">⌨️ Atalhos de Teclado (Desktop)</div>
        <div class="prop-row"><span>Pincel de Terreno:</span><kbd class="btn-pill">B</kbd></div>
        <div class="prop-row"><span>Balde de Tinta (Fill):</span><kbd class="btn-pill">F</kbd></div>
        <div class="prop-row"><span>Borracha de Objetos:</span><kbd class="btn-pill">E</kbd></div>
        <div class="prop-row"><span>Colocar Objeto:</span><kbd class="btn-pill">O</kbd></div>
        <div class="prop-row"><span>Pincel de Dispersão (Scatter):</span><kbd class="btn-pill">R</kbd></div>
        <div class="prop-row"><span>Selecionar / Mover Objeto:</span><kbd class="btn-pill">V</kbd></div>
        <div class="prop-row"><span>Mover Câmera (Pan):</span><kbd class="btn-pill">H / Botão do Meio / Espaço+Drag</kbd></div>
        <div class="prop-row"><span>Ligar/Desligar Grade:</span><kbd class="btn-pill">G</kbd></div>
        <div class="prop-row"><span>Ligar/Desligar Colisões:</span><kbd class="btn-pill">C</kbd></div>
        <div class="prop-row"><span>Ligar/Desligar Ponto Âncora:</span><kbd class="btn-pill">A</kbd></div>
        <div class="prop-row"><span>Ligar/Desligar Linhas Y Depth:</span><kbd class="btn-pill">Y</kbd></div>
        <div class="prop-row"><span>Modo Jogador Teste (Walk):</span><kbd class="btn-pill">P (WASD)</kbd></div>
        <div class="prop-row"><span>Desfazer / Refazer:</span><kbd class="btn-pill">Ctrl+Z / Ctrl+Y</kbd></div>
        <div class="prop-row"><span>Salvar Mapa JSON:</span><kbd class="btn-pill">Ctrl+S</kbd></div>
        <div class="prop-row"><span>Snap to Grid:</span><kbd class="btn-pill">Segurar Shift</kbd></div>
      </div>
    `;

    const footer = `<button class="btn-pill primary" id="modal-ok-btn">Entendido</button>`;
    this.openModal('Guia de Atalhos & Gestos Touch', content, footer);
    document.getElementById('modal-ok-btn').addEventListener('click', () => this.closeModal());
  }
}
