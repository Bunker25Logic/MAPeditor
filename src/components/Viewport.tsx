/**
 * src/components/Viewport.tsx
 * PixiJS viewport canvas container with touch/mouse interaction, floating HUD, and D-Pad controls.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor } from '../core/EditorContext';
import { PaintTilesCommand } from '../core/history/commands/PaintTilesCommand';
import { AddObjectCommand, RemoveObjectCommand, TransformObjectCommand } from '../core/history/commands/ObjectCommands';
import { Plus, Minus, Crosshair, Gamepad2, X } from 'lucide-react';
import { MapObject } from '../core/types';

export const Viewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    renderer,
    map,
    state,
    editorState,
    executeCommand,
    setSelectedObject,
    updateCursorCoords,
    zoomBy,
    centerCamera
  } = useEditor();

  const [isPanning, setIsPanning] = useState(false);
  const isPointerDownRef = useRef(false);
  const pointerButtonRef = useRef(0);
  const isDraggingObjectRef = useRef(false);
  const dragStartObjRef = useRef<MapObject | null>(null);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Player position state for player mode
  const playerPosRef = useRef({ x: 33 * 32, y: 32 * 32 });

  // Initialize Pixi application inside the DOM node on mount
  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;
    if (!container) return;

    renderer.init(container).then(() => {
      if (mounted) {
        // Initial map setup
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        renderer.resize(w, h);
        renderer.camera.centerOnWorld((map.width * map.tileSize) / 2, (map.height * map.tileSize) / 2);
        renderer.invalidateTerrain();
        renderer.invalidateObjects();
        renderer.invalidateGrid();
        renderer.invalidateCollision();
        renderer.render(map, editorState.current);
      }
    });

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          renderer.resize(entry.contentRect.width, entry.contentRect.height);
          renderer.render(map, editorState.current);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      mounted = false;
      resizeObserver.disconnect();
    };
  }, [renderer]);

  // Re-render when map or active tool/layer/selection changes
  useEffect(() => {
    renderer.invalidateTerrain();
    renderer.invalidateObjects();
    renderer.invalidateGrid();
    renderer.invalidateCollision();
    renderer.render(map, editorState.current);
  }, [map, state, renderer, editorState]);

  // Handle pointer down
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    try {
      container.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    isPointerDownRef.current = true;
    pointerButtonRef.current = e.button;

    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    updateCursorCoords(screenX, screenY);

    const { wx, wy } = renderer.camera.screenToWorld(screenX, screenY);
    const { tx, ty } = map.worldToTile(wx, wy);

    // Right click or Middle click -> Pan
    if (e.button === 1 || e.button === 2 || state.activeTool === 'hand') {
      setIsPanning(true);
      renderer.camera.isDragging = true;
      renderer.camera.dragStartX = screenX;
      renderer.camera.dragStartY = screenY;
      renderer.camera.startCamX = renderer.camera.x;
      renderer.camera.startCamY = renderer.camera.y;
      return;
    }

    // Left click tool actions
    if (e.button === 0) {
      if (state.activeTool === 'paint') {
        const oldTile = map.getTile(tx, ty);
        if (oldTile !== state.selectedTerrainId) {
          const cmd = new PaintTilesCommand(map, [{ tx, ty, oldId: oldTile, newId: state.selectedTerrainId }]);
          executeCommand(cmd);
        }
      } else if (state.activeTool === 'fill') {
        const changes = map.floodFill(tx, ty, state.selectedTerrainId);
        if (changes.length > 0) {
          const cmd = new PaintTilesCommand(map, changes);
          executeCommand(cmd);
        }
      } else if (state.activeTool === 'object') {
        const newObj: Partial<MapObject> & { asset: string } = {
          asset: state.selectedObjectAsset,
          x: Math.round(wx),
          y: Math.round(wy)
        };
        const created = map.addObject(newObj);
        const cmd = new AddObjectCommand(map, created);
        executeCommand(cmd);
        setSelectedObject(created.id);
      } else if (state.activeTool === 'scatter') {
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 48;
          const offsetY = (Math.random() - 0.5) * 48;
          const scale = 0.85 + Math.random() * 0.3;
          const created = map.addObject({
            asset: state.selectedObjectAsset,
            x: Math.round(wx + offsetX),
            y: Math.round(wy + offsetY),
            scaleX: scale,
            scaleY: scale
          });
          const cmd = new AddObjectCommand(map, created);
          executeCommand(cmd);
        }
      } else if (state.activeTool === 'select') {
        const hit = map.findObjectAt(wx, wy, id => renderer.getObjectDef(id));
        if (hit) {
          setSelectedObject(hit.id);
          isDraggingObjectRef.current = true;
          dragStartObjRef.current = { ...hit };
        } else {
          setSelectedObject(null);
        }
        renderer.render(map, editorState.current);
      } else if (state.activeTool === 'eraser') {
        const hit = map.findObjectAt(wx, wy, id => renderer.getObjectDef(id));
        if (hit) {
          const cmd = new RemoveObjectCommand(map, hit);
          executeCommand(cmd);
          if (state.selectedObjectId === hit.id) {
            setSelectedObject(null);
          }
        }
      }
    }
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    updateCursorCoords(screenX, screenY);

    if (renderer.camera.isDragging) {
      const dx = screenX - renderer.camera.dragStartX;
      const dy = screenY - renderer.camera.dragStartY;
      renderer.camera.setPosition(renderer.camera.startCamX + dx, renderer.camera.startCamY + dy);
      renderer.render(map, editorState.current);
      return;
    }

    if (isPointerDownRef.current && pointerButtonRef.current === 0) {
      const { wx, wy } = renderer.camera.screenToWorld(screenX, screenY);
      const { tx, ty } = map.worldToTile(wx, wy);

      if (state.activeTool === 'paint') {
        const oldTile = map.getTile(tx, ty);
        if (oldTile !== state.selectedTerrainId && map.inBounds(tx, ty)) {
          const cmd = new PaintTilesCommand(map, [{ tx, ty, oldId: oldTile, newId: state.selectedTerrainId }]);
          executeCommand(cmd);
        }
      } else if (state.activeTool === 'select' && isDraggingObjectRef.current && state.selectedObjectId) {
        map.updateObject(state.selectedObjectId, { x: Math.round(wx), y: Math.round(wy) });
        renderer.invalidateObjects();
        renderer.render(map, editorState.current);
      }
    }
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      try {
        if (container.hasPointerCapture(e.pointerId)) {
          container.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe fallback
      }
    }

    activePointersRef.current.delete(e.pointerId);
    isPointerDownRef.current = false;
    setIsPanning(false);
    renderer.camera.isDragging = false;

    // Commit drag transform to history
    if (isDraggingObjectRef.current && state.selectedObjectId && dragStartObjRef.current) {
      const currentObj = map.getObject(state.selectedObjectId);
      if (currentObj) {
        const hasMoved = currentObj.x !== dragStartObjRef.current.x || currentObj.y !== dragStartObjRef.current.y;
        if (hasMoved) {
          const cmd = new TransformObjectCommand(
            map,
            currentObj.id,
            { x: dragStartObjRef.current.x, y: dragStartObjRef.current.y },
            { x: currentObj.x, y: currentObj.y }
          );
          executeCommand(cmd);
        }
      }
    }

    isDraggingObjectRef.current = false;
    dragStartObjRef.current = null;
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    renderer.camera.zoomBy(factor, screenX, screenY);
    renderer.render(map, editorState.current);
  };

  // Virtual D-Pad step for player mode
  const stepPlayer = (dx: number, dy: number) => {
    playerPosRef.current.x += dx * 16;
    playerPosRef.current.y += dy * 16;
    renderer.camera.centerOnWorld(playerPosRef.current.x, playerPosRef.current.y);
    renderer.render(map, editorState.current);
  };

  return (
    <div
      ref={containerRef}
      id="viewport-container"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
      className={`relative flex-1 h-full bg-[#0c0e12] overflow-hidden select-none touch-none ${
        isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
    >
      {/* Player Mode HUD */}
      {state.playerMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-950/80 border border-emerald-500/80 rounded-full text-white text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md z-30 animate-pulse">
          <Gamepad2 className="w-4 h-4 text-emerald-400" />
          <span>MODO JOGADOR ATIVO • Use WASD ou o D-Pad Touch</span>
        </div>
      )}

      {/* Floating Viewport Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-30">
        <button
          onClick={() => zoomBy(1.2)}
          className="w-8 h-8 rounded-md bg-[#21252f]/90 hover:bg-[#323847] border border-[#2d3342] text-[#f0f3f8] flex items-center justify-center shadow-lg transition-colors"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoomBy(0.8)}
          className="w-8 h-8 rounded-md bg-[#21252f]/90 hover:bg-[#323847] border border-[#2d3342] text-[#f0f3f8] flex items-center justify-center shadow-lg transition-colors"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={centerCamera}
          className="w-8 h-8 rounded-md bg-[#21252f]/90 hover:bg-[#323847] border border-[#2d3342] text-[#f0f3f8] flex items-center justify-center shadow-lg transition-colors"
          title="Centralizar Mapa"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* On-Screen Touch Virtual D-Pad for Mobile Player Testing */}
      {state.playerMode && (
        <div className="absolute bottom-6 left-6 flex flex-col items-center gap-2 z-30">
          <div className="flex flex-col items-center bg-[#1a1d24]/90 p-2 rounded-2xl border border-[#2d3342] shadow-2xl backdrop-blur-sm">
            <button
              onClick={() => stepPlayer(0, -1)}
              className="w-10 h-10 bg-[#282d39] active:bg-emerald-600 text-white rounded-lg font-bold text-sm"
            >
              ▲
            </button>
            <div className="flex gap-2 my-1">
              <button
                onClick={() => stepPlayer(-1, 0)}
                className="w-10 h-10 bg-[#282d39] active:bg-emerald-600 text-white rounded-lg font-bold text-sm"
              >
                ◀
              </button>
              <div className="w-10 h-10 flex items-center justify-center text-xs text-emerald-400">●</div>
              <button
                onClick={() => stepPlayer(1, 0)}
                className="w-10 h-10 bg-[#282d39] active:bg-emerald-600 text-white rounded-lg font-bold text-sm"
              >
                ▶
              </button>
            </div>
            <button
              onClick={() => stepPlayer(0, 1)}
              className="w-10 h-10 bg-[#282d39] active:bg-emerald-600 text-white rounded-lg font-bold text-sm"
            >
              ▼
            </button>
          </div>
          <button
            onClick={() => editorState.togglePlayerMode()}
            className="px-3 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 rounded-full text-[11px] text-rose-300 font-medium flex items-center gap-1 shadow-lg"
          >
            <X className="w-3 h-3" /> Sair do Modo Jogador
          </button>
        </div>
      )}
    </div>
  );
};
