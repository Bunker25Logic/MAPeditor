/**
 * src/core/EditorContext.tsx
 * React Context provider connecting Core, GameMap, PixiRenderer, History and EditorState.
 * Guarantees strict UI -> Command -> GameMap -> Renderer flow with 100% undo/redo and dirty tracking.
 */

import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { GameMap } from './map/GameMap';
import { EditorState } from './EditorState';
import { History } from './history/History';
import { PixiRenderer } from '../rendering/PixiRenderer';
import { EditorStateModel, EditorTool, EditorLayer, MapObject, MapData } from './types';
import { Command } from './history/Command';
import {
  AddObjectCommand,
  RemoveObjectCommand,
  TransformObjectCommand,
  BatchAddObjectsCommand,
  ClearObjectsCommand
} from './history/commands/ObjectCommands';
import { PaintTilesCommand } from './history/commands/PaintTilesCommand';
import { ResizeMapCommand } from './history/commands/ResizeMapCommand';

export interface CursorInfo {
  worldX: number;
  worldY: number;
  tileX: number;
  tileY: number;
  chunkX: number;
  chunkY: number;
}

export interface EditorContextValue {
  map: GameMap;
  editorState: EditorState;
  state: Readonly<EditorStateModel>;
  history: History;
  renderer: PixiRenderer;
  canUndo: boolean;
  canRedo: boolean;
  selectedObject: MapObject | null;
  zoomPercent: number;
  visibleObjectsCount: number;
  totalObjectsCount: number;

  // Actions
  setTool: (tool: EditorTool) => void;
  setLayer: (layer: EditorLayer) => void;
  setSelectedTerrain: (id: string) => void;
  setSelectedAsset: (assetId: string) => void;
  setSelectedObject: (id: string | null) => void;
  executeCommand: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  createNewMap: (width: number, height: number, defaultTerrain: string) => void;
  loadMapData: (data: MapData) => void;
  saveMapJSON: () => void;
  exportPNG: () => void;
  fillAllTerrain: (terrainId: string) => void;
  clearAllObjects: () => void;
  generateForest: () => void;
  generateRocks: () => void;
  centerCamera: () => void;
  zoomBy: (factor: number) => void;
  updateSelectedTransform: (changes: Partial<MapObject>) => void;
  deleteSelectedObject: () => void;
  updateCursorCoords: (screenX: number, screenY: number) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const useEditor = (): EditorContextValue => {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core Map instance
  const [map, setMap] = useState<GameMap>(() => new GameMap({ width: 64, height: 64, defaultTerrain: 'grass' }));

  // Observable editor state
  const editorStateRef = useRef<EditorState>(new EditorState());
  const editorState = editorStateRef.current;

  // React state mirroring EditorState
  const [state, setState] = useState<Readonly<EditorStateModel>>(() => editorState.current);

  // Undo/Redo command history
  const historyRef = useRef<History>(new History(100));
  const history = historyRef.current;

  // Pixi Renderer instance
  const rendererRef = useRef<PixiRenderer>(new PixiRenderer());
  const renderer = rendererRef.current;

  // UI status states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [totalObjectsCount, setTotalObjectsCount] = useState(0);

  // History state updater (includes dirty flag synchronization)
  const updateHistoryState = useCallback(() => {
    setCanUndo(history.canUndo());
    setCanRedo(history.canRedo());
    editorState.setDirty(history.isDirty());
  }, [history, editorState]);

  // Subscribe to EditorState changes
  useEffect(() => {
    const unsub = editorState.subscribe(newState => {
      setState(newState);
      renderer.render(map, newState);
    });
    return unsub;
  }, [editorState, renderer, map]);

  useEffect(() => {
    history.setOnStateChange(updateHistoryState);
  }, [history, updateHistoryState]);

  // Sync objects count
  useEffect(() => {
    setTotalObjectsCount(map.objects.length);
  }, [map, state]);

  // Get currently selected object
  const selectedObject = useMemo(() => {
    if (!state.selectedObjectId) return null;
    return map.getObject(state.selectedObjectId);
  }, [map, state.selectedObjectId, state]);

  const executeCommand = useCallback(
    (cmd: Command) => {
      history.execute(cmd);
      updateHistoryState();
      renderer.invalidateTerrain();
      renderer.invalidateObjects();
      renderer.invalidateCollision();
      renderer.render(map, editorState.current);
      setTotalObjectsCount(map.objects.length);
    },
    [history, updateHistoryState, renderer, map, editorState]
  );

  const undo = useCallback(() => {
    if (history.undo()) {
      updateHistoryState();
      renderer.invalidateTerrain();
      renderer.invalidateObjects();
      renderer.invalidateCollision();
      renderer.render(map, editorState.current);
      setTotalObjectsCount(map.objects.length);
    }
  }, [history, updateHistoryState, renderer, map, editorState]);

  const redo = useCallback(() => {
    if (history.redo()) {
      updateHistoryState();
      renderer.invalidateTerrain();
      renderer.invalidateObjects();
      renderer.invalidateCollision();
      renderer.render(map, editorState.current);
      setTotalObjectsCount(map.objects.length);
    }
  }, [history, updateHistoryState, renderer, map, editorState]);

  const setTool = useCallback((tool: EditorTool) => editorState.setTool(tool), [editorState]);
  const setLayer = useCallback((layer: EditorLayer) => editorState.setLayer(layer), [editorState]);
  const setSelectedTerrain = useCallback((id: string) => editorState.setSelectedTerrain(id), [editorState]);
  const setSelectedAsset = useCallback((assetId: string) => editorState.setSelectedAsset(assetId), [editorState]);
  const setSelectedObject = useCallback((id: string | null) => editorState.setSelectedObject(id), [editorState]);

  const createNewMap = useCallback(
    (width: number, height: number, defaultTerrain: string) => {
      const newMap = new GameMap({ width, height, defaultTerrain });
      setMap(newMap);
      history.clear();
      history.markSaved();
      updateHistoryState();
      editorState.setSelectedObject(null);
      renderer.invalidateTerrain();
      renderer.invalidateObjects();
      renderer.invalidateGrid();
      renderer.invalidateCollision();
      renderer.camera.centerOnWorld((width * 32) / 2, (height * 32) / 2);
      renderer.render(newMap, editorState.current);
      setTotalObjectsCount(0);
    },
    [history, updateHistoryState, editorState, renderer]
  );

  const loadMapData = useCallback(
    async (data: MapData) => {
      // Restore custom imported assets first if present in map file
      if (data.customAssets && data.customAssets.length > 0) {
        await renderer.assetManager.importCustomAssets(data.customAssets);
      }

      const newMap = new GameMap({
        width: data.width,
        height: data.height,
        tileSize: data.tileSize || 32,
        chunkSize: data.chunkSize || 16
      });
      newMap.terrain = data.terrain;
      newMap.objects = data.objects || [];
      newMap.collision = data.collision || newMap.collision;

      setMap(newMap);
      history.clear();
      history.markSaved();
      updateHistoryState();
      editorState.setSelectedObject(null);
      renderer.invalidateTerrain();
      renderer.invalidateObjects();
      renderer.invalidateGrid();
      renderer.invalidateCollision();
      renderer.camera.centerOnWorld((data.width * 32) / 2, (data.height * 32) / 2);
      renderer.render(newMap, editorState.current);
      setTotalObjectsCount(newMap.objects.length);
    },
    [history, updateHistoryState, editorState, renderer]
  );

  const saveMapJSON = useCallback(() => {
    const data = map.toJSON();
    data.customAssets = renderer.assetManager.exportCustomAssets();
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mmo_map_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    history.markSaved();
    updateHistoryState();
  }, [map, history, updateHistoryState, renderer]);

  const exportPNG = useCallback(() => {
    if (!renderer.app) return;
    renderer.app.render();
    const canvas = renderer.app.view as HTMLCanvasElement;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `mmo_map_render_${Date.now()}.png`;
      a.click();
    }
  }, [renderer]);

  const fillAllTerrain = useCallback(
    (terrainId: string) => {
      const changes = map.calculateFillAll(terrainId);
      if (changes.length > 0) {
        const cmd = new PaintTilesCommand(map, changes, 'Fill All Terrain');
        executeCommand(cmd);
      }
    },
    [map, executeCommand]
  );

  const clearAllObjects = useCallback(() => {
    if (map.objects.length === 0) return;
    const cmd = new ClearObjectsCommand(map);
    executeCommand(cmd);
    editorState.setSelectedObject(null);
  }, [map, executeCommand, editorState]);

  const generateForest = useCallback(() => {
    const assets = ['tree_oak', 'tree_pine', 'bush'];
    const objectsData: Array<Partial<MapObject> & { asset: string }> = [];
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * (map.width * map.tileSize);
      const y = Math.random() * (map.height * map.tileSize);
      const asset = assets[Math.floor(Math.random() * assets.length)];
      objectsData.push({
        asset,
        x: Math.round(x),
        y: Math.round(y),
        scaleX: Number((0.9 + Math.random() * 0.2).toFixed(2)),
        scaleY: Number((0.9 + Math.random() * 0.2).toFixed(2)),
        rotation: Number(((Math.random() - 0.5) * 0.1).toFixed(3))
      });
    }
    const cmd = new BatchAddObjectsCommand(map, objectsData, 'Generate Forest');
    executeCommand(cmd);
  }, [map, executeCommand]);

  const generateRocks = useCallback(() => {
    const assets = ['rock_large', 'rock_small'];
    const objectsData: Array<Partial<MapObject> & { asset: string }> = [];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * (map.width * map.tileSize);
      const y = Math.random() * (map.height * map.tileSize);
      const asset = assets[Math.floor(Math.random() * assets.length)];
      objectsData.push({
        asset,
        x: Math.round(x),
        y: Math.round(y),
        scaleX: Number((0.85 + Math.random() * 0.3).toFixed(2)),
        scaleY: Number((0.85 + Math.random() * 0.3).toFixed(2))
      });
    }
    const cmd = new BatchAddObjectsCommand(map, objectsData, 'Generate Rocks');
    executeCommand(cmd);
  }, [map, executeCommand]);

  const centerCamera = useCallback(() => {
    renderer.camera.centerOnWorld((map.width * map.tileSize) / 2, (map.height * map.tileSize) / 2);
    setZoomPercent(Math.round(renderer.camera.zoom * 100));
    renderer.render(map, editorState.current);
  }, [map, renderer, editorState]);

  const zoomBy = useCallback(
    (factor: number) => {
      renderer.camera.zoomBy(factor);
      setZoomPercent(Math.round(renderer.camera.zoom * 100));
      renderer.render(map, editorState.current);
    },
    [renderer, map, editorState]
  );

  const updateSelectedTransform = useCallback(
    (changes: Partial<MapObject>) => {
      if (!state.selectedObjectId) return;
      const obj = map.getObject(state.selectedObjectId);
      if (!obj) return;
      const oldState: Partial<MapObject> = {};
      const newState: Partial<MapObject> = {};
      for (const key of Object.keys(changes) as (keyof MapObject)[]) {
        (oldState as any)[key] = obj[key];
        (newState as any)[key] = changes[key];
      }
      const cmd = new TransformObjectCommand(map, state.selectedObjectId, oldState, newState);
      executeCommand(cmd);
    },
    [state.selectedObjectId, map, executeCommand]
  );

  const deleteSelectedObject = useCallback(() => {
    if (!state.selectedObjectId) return;
    const obj = map.getObject(state.selectedObjectId);
    if (obj) {
      const cmd = new RemoveObjectCommand(map, obj);
      executeCommand(cmd);
      editorState.setSelectedObject(null);
    }
  }, [state.selectedObjectId, map, executeCommand, editorState]);

  const updateCursorCoords = useCallback(
    (screenX: number, screenY: number) => {
      const { wx, wy } = renderer.camera.screenToWorld(screenX, screenY);
      const { tx, ty } = map.worldToTile(wx, wy);
      const cx = Math.floor(tx / map.chunkSize);
      const cy = Math.floor(ty / map.chunkSize);

      const rX = Math.round(wx);
      const rY = Math.round(wy);

      const elCursor = document.getElementById('status-cursor-coords');
      if (elCursor) elCursor.textContent = `X: ${rX} Y: ${rY}`;

      const elTile = document.getElementById('status-tile-coords');
      if (elTile) elTile.textContent = `[${tx}, ${ty}]`;

      const elChunk = document.getElementById('status-chunk-coords');
      if (elChunk) elChunk.textContent = `[${cx}, ${cy}]`;
    },
    [renderer, map]
  );

  const value: EditorContextValue = {
    map,
    editorState,
    state,
    history,
    renderer,
    canUndo,
    canRedo,
    selectedObject,
    zoomPercent,
    visibleObjectsCount: map.objects.length,
    totalObjectsCount,

    setTool,
    setLayer,
    setSelectedTerrain,
    setSelectedAsset,
    setSelectedObject,
    executeCommand,
    undo,
    redo,
    createNewMap,
    loadMapData,
    saveMapJSON,
    exportPNG,
    fillAllTerrain,
    clearAllObjects,
    generateForest,
    generateRocks,
    centerCamera,
    zoomBy,
    updateSelectedTransform,
    deleteSelectedObject,
    updateCursorCoords
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
