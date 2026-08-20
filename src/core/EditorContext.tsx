/**
 * src/core/EditorContext.tsx
 * React Context provider connecting Core, GameMap, PixiRenderer, History and EditorState.
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
  TransformObjectCommand
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
  cursorInfo: CursorInfo;
  zoomPercent: number;
  fps: number;
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

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return ctx;
}

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [map, setMap] = useState<GameMap>(() => {
    const initialMap = new GameMap({ width: 64, height: 64, defaultTerrain: 'grass' });
    // Seed sample dirt path across center
    for (let x = 20; x <= 44; x++) {
      initialMap.setTile(x, 32, 'dirt');
      initialMap.setTile(x, 33, 'dirt');
    }
    // Seed small stone plaza
    for (let x = 30; x <= 34; x++) {
      for (let y = 30; y <= 35; y++) {
        initialMap.setTile(x, y, 'stone');
      }
    }
    // Seed sample pond
    for (let x = 12; x <= 18; x++) {
      for (let y = 12; y <= 18; y++) {
        if (Math.hypot(x - 15, y - 15) <= 3.2) {
          initialMap.setTile(x, y, 'water');
        }
      }
    }
    // Seed sample trees & objects
    initialMap.addObject({ asset: 'house_wood', x: 32 * 32, y: 28 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'lamp_post', x: 29 * 32, y: 34 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'lamp_post', x: 35 * 32, y: 34 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'chest', x: 34 * 32, y: 31 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'barrel', x: 30 * 32, y: 31 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'tree_oak', x: 24 * 32, y: 28 * 32, scaleX: 1.1, scaleY: 1.1 });
    initialMap.addObject({ asset: 'tree_oak', x: 40 * 32, y: 28 * 32, scaleX: 1.05, scaleY: 1.05 });
    initialMap.addObject({ asset: 'tree_pine', x: 22 * 32, y: 36 * 32, scaleX: 1.0, scaleY: 1.0 });
    initialMap.addObject({ asset: 'tree_pine', x: 42 * 32, y: 36 * 32, scaleX: 1.0, scaleY: 1.0 });
    initialMap.addObject({ asset: 'rock_large', x: 18 * 32, y: 22 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'bush', x: 26 * 32, y: 34 * 32, scaleX: 1, scaleY: 1 });
    initialMap.addObject({ asset: 'bush', x: 38 * 32, y: 34 * 32, scaleX: 1, scaleY: 1 });
    return initialMap;
  });
  const [editorState] = useState<EditorState>(() => new EditorState());
  const [state, setState] = useState<Readonly<EditorStateModel>>(() => editorState.current);
  const [renderer] = useState<PixiRenderer>(() => new PixiRenderer());
  const [history] = useState<History>(() => new History(50));

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorInfo, setCursorInfo] = useState<CursorInfo>({
    worldX: 0,
    worldY: 0,
    tileX: 0,
    tileY: 0,
    chunkX: 0,
    chunkY: 0
  });
  const [zoomPercent, setZoomPercent] = useState(100);
  const [fps, setFps] = useState(60);
  const [totalObjectsCount, setTotalObjectsCount] = useState(0);

  // Live FPS measurement loop
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (currentTime: number) => {
      frameCount++;
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Subscribe to EditorState changes
  useEffect(() => {
    const unsub = editorState.subscribe(newState => {
      setState(newState);
      renderer.render(map, newState);
    });
    return unsub;
  }, [editorState, renderer, map]);

  // History state updater
  const updateHistoryState = useCallback(() => {
    setCanUndo(history.canUndo());
    setCanRedo(history.canRedo());
  }, [history]);

  useEffect(() => {
    // Connect history notification
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
    (data: MapData) => {
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
    const str = JSON.stringify(data, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mmo_map_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [map]);

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
      const changes: Array<{ tx: number; ty: number; oldId: string | null; newId: string }> = [];
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          const old = map.getTile(x, y);
          if (old !== terrainId) {
            changes.push({ tx: x, ty: y, oldId: old, newId: terrainId });
          }
        }
      }
      if (changes.length > 0) {
        const cmd = new PaintTilesCommand(map, changes);
        executeCommand(cmd);
      }
    },
    [map, executeCommand]
  );

  const clearAllObjects = useCallback(() => {
    if (map.objects.length === 0) return;
    const toRemove = [...map.objects];
    for (const obj of toRemove) {
      map.removeObject(obj.id);
    }
    editorState.setSelectedObject(null);
    renderer.invalidateObjects();
    renderer.render(map, editorState.current);
    setTotalObjectsCount(0);
  }, [map, editorState, renderer]);

  const generateForest = useCallback(() => {
    const assets = ['tree_oak', 'tree_pine', 'bush'];
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * (map.width * map.tileSize);
      const y = Math.random() * (map.height * map.tileSize);
      const asset = assets[Math.floor(Math.random() * assets.length)];
      map.addObject({
        asset,
        x,
        y,
        scaleX: 0.9 + Math.random() * 0.2,
        scaleY: 0.9 + Math.random() * 0.2,
        rotation: (Math.random() - 0.5) * 0.1
      });
    }
    renderer.invalidateObjects();
    renderer.render(map, editorState.current);
    setTotalObjectsCount(map.objects.length);
  }, [map, renderer, editorState]);

  const generateRocks = useCallback(() => {
    const assets = ['rock_large', 'rock_small'];
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * (map.width * map.tileSize);
      const y = Math.random() * (map.height * map.tileSize);
      const asset = assets[Math.floor(Math.random() * assets.length)];
      map.addObject({
        asset,
        x,
        y,
        scaleX: 0.85 + Math.random() * 0.3,
        scaleY: 0.85 + Math.random() * 0.3
      });
    }
    renderer.invalidateObjects();
    renderer.render(map, editorState.current);
    setTotalObjectsCount(map.objects.length);
  }, [map, renderer, editorState]);

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
      map.updateObject(state.selectedObjectId, changes);
      renderer.invalidateObjects();
      renderer.render(map, editorState.current);
    },
    [state.selectedObjectId, map, renderer, editorState]
  );

  const deleteSelectedObject = useCallback(() => {
    if (!state.selectedObjectId) return;
    const removed = map.removeObject(state.selectedObjectId);
    if (removed) {
      editorState.setSelectedObject(null);
      renderer.invalidateObjects();
      renderer.render(map, editorState.current);
      setTotalObjectsCount(map.objects.length);
    }
  }, [state.selectedObjectId, map, editorState, renderer]);

  const updateCursorCoords = useCallback(
    (screenX: number, screenY: number) => {
      const { wx, wy } = renderer.camera.screenToWorld(screenX, screenY);
      const { tx, ty } = map.worldToTile(wx, wy);
      const cx = Math.floor(tx / map.chunkSize);
      const cy = Math.floor(ty / map.chunkSize);

      setCursorInfo({
        worldX: Math.round(wx),
        worldY: Math.round(wy),
        tileX: tx,
        tileY: ty,
        chunkX: cx,
        chunkY: cy
      });
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
    cursorInfo,
    zoomPercent,
    fps,
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
