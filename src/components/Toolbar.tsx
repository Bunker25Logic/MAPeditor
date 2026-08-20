/**
 * src/components/Toolbar.tsx
 * Quick tool selector and layer viewport toggles.
 */

import React from 'react';
import { useEditor } from '../core/EditorContext';
import { EditorTool } from '../core/types';
import {
  Paintbrush,
  PaintBucket,
  PlusCircle,
  Sparkles,
  MousePointer,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  Grid,
  Shield,
  Gamepad2
} from 'lucide-react';

export const Toolbar: React.FC = () => {
  const {
    state,
    setTool,
    editorState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useEditor();

  const tools: Array<{ id: EditorTool; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'paint', label: 'Pincel', icon: <Paintbrush className="w-4 h-4" />, shortcut: 'B' },
    { id: 'fill', label: 'Balde', icon: <PaintBucket className="w-4 h-4" />, shortcut: 'F' },
    { id: 'object', label: 'Colocar Objeto', icon: <PlusCircle className="w-4 h-4" />, shortcut: 'O' },
    { id: 'scatter', label: 'Scatter Brush', icon: <Sparkles className="w-4 h-4" />, shortcut: 'R' },
    { id: 'select', label: 'Selecionar', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'eraser', label: 'Borracha', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
    { id: 'hand', label: 'Mover Câmera', icon: <Hand className="w-4 h-4" />, shortcut: 'H' }
  ];

  return (
    <section
      id="toolbar"
      className="h-11 bg-[#1a1d24] border-b border-[#2d3342] flex items-center justify-between px-3 z-40 select-none overflow-x-auto"
    >
      <div className="flex items-center gap-1.5 min-w-max">
        {tools.map(tool => {
          const isActive = state.activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setTool(tool.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : 'bg-[#282d39] text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#323847] border border-[#2d3342]'
              }`}
              title={`${tool.label} [${tool.shortcut}]`}
            >
              {tool.icon}
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 min-w-max">
        {/* History actions */}
        <div className="flex items-center gap-1 bg-[#21252f] p-0.5 rounded border border-[#2d3342]">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#323847] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#323847] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-[#2d3342]" />

        {/* View toggles */}
        <button
          onClick={() => editorState.toggleGrid()}
          className={`p-1.5 rounded text-xs transition-colors border ${
            state.gridVisible
              ? 'bg-blue-950/60 border-blue-500/50 text-blue-400'
              : 'bg-[#282d39] border-[#2d3342] text-[#9ba3b4] hover:text-[#f0f3f8]'
          }`}
          title="Grade de Tiles (G)"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => editorState.toggleCollision()}
          className={`p-1.5 rounded text-xs transition-colors border ${
            state.collisionVisible
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
              : 'bg-[#282d39] border-[#2d3342] text-[#9ba3b4] hover:text-[#f0f3f8]'
          }`}
          title="Colisões (C)"
        >
          <Shield className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#2d3342]" />

        {/* Player Test Mode */}
        <button
          onClick={() => editorState.togglePlayerMode()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all border ${
            state.playerMode
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/30 animate-pulse'
              : 'bg-[#282d39] border-[#2d3342] text-[#9ba3b4] hover:text-emerald-400 hover:bg-[#323847]'
          }`}
          title="Modo Jogador Teste (P)"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>{state.playerMode ? 'JOGADOR ATIVO' : 'Testar Jogador (P)'}</span>
        </button>
      </div>
    </section>
  );
};
