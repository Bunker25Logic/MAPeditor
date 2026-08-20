/**
 * src/components/StatusBar.tsx
 * Bottom status bar showing live coordinates, tile, chunk, zoom, active tool, saved/dirty state and FPS.
 */

import React from 'react';
import { useEditor } from '../core/EditorContext';

export const StatusBar: React.FC = () => {
  const { cursorInfo, zoomPercent, state, map, fps } = useEditor();

  return (
    <footer
      id="status-bar"
      className="h-7 bg-[#121418] border-t border-[#2d3342] flex items-center justify-between px-3 text-[11px] text-[#9ba3b4] select-none z-30"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Cursor:</span>
          <span className="text-[#f0f3f8]">
            X: {cursorInfo.worldX} Y: {cursorInfo.worldY}
          </span>
        </div>
        <div className="font-mono">
          Tile: <span className="text-[#f0f3f8]">[{cursorInfo.tileX}, {cursorInfo.tileY}]</span>
        </div>
        <div className="hidden sm:block font-mono">
          Chunk: <span className="text-[#f0f3f8]">[{cursorInfo.chunkX}, {cursorInfo.chunkY}]</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${state.dirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className={state.dirty ? 'text-amber-400 font-medium' : 'text-[#677184]'}>
            {state.dirty ? 'Não Salvo' : 'Salvo'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div>
          Zoom: <span className="text-[#f0f3f8] font-mono">{zoomPercent}%</span>
        </div>
        <div>
          Ferramenta: <span className="text-blue-400 capitalize font-medium">{state.activeTool}</span>
        </div>
        <div>
          Objetos: <span className="text-[#f0f3f8] font-mono">{map.objects.length}</span>
        </div>
        <div className="font-mono text-emerald-400 font-medium">{fps} FPS</div>
      </div>
    </footer>
  );
};
