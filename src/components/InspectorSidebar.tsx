/**
 * src/components/InspectorSidebar.tsx
 * Right sidebar for object transform inspector, scatter brush settings, procedural generators, and hierarchy.
 */

import React, { useState, useEffect } from 'react';
import { useEditor } from '../core/EditorContext';
import { Sliders, Sparkles, Trash2, ListTree, Trees, Mountain } from 'lucide-react';
import { MapObject } from '../core/types';

export const InspectorSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const {
    map,
    state,
    selectedObject,
    updateSelectedTransform,
    deleteSelectedObject,
    setSelectedObject,
    generateForest,
    generateRocks
  } = useEditor();

  // Local form state for selected object to allow smooth typing and commit on blur/change
  const [posX, setPosX] = useState<string>('');
  const [posY, setPosY] = useState<string>('');
  const [scaleX, setScaleX] = useState<string>('');
  const [scaleY, setScaleY] = useState<string>('');
  const [rotDeg, setRotDeg] = useState<string>('');
  const [anchorX, setAnchorX] = useState<string>('');
  const [anchorY, setAnchorY] = useState<string>('');
  const [collision, setCollision] = useState<boolean>(true);

  // Sync inputs when selectedObject changes
  useEffect(() => {
    if (selectedObject) {
      setPosX(selectedObject.x.toString());
      setPosY(selectedObject.y.toString());
      setScaleX(selectedObject.scaleX.toString());
      setScaleY(selectedObject.scaleY.toString());
      setRotDeg(Math.round(((selectedObject.rotation || 0) * 180) / Math.PI).toString());
      setAnchorX(selectedObject.anchorX !== undefined ? selectedObject.anchorX.toString() : '0.5');
      setAnchorY(selectedObject.anchorY !== undefined ? selectedObject.anchorY.toString() : '1.0');
      setCollision(Boolean(selectedObject.collision));
    }
  }, [selectedObject]);

  const parseNum = (val: string, fallback: number): number => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const handleApplyTransform = () => {
    if (!selectedObject) return;
    const rot = parseNum(rotDeg, 0);
    updateSelectedTransform({
      x: parseNum(posX, selectedObject.x),
      y: parseNum(posY, selectedObject.y),
      scaleX: parseNum(scaleX, selectedObject.scaleX),
      scaleY: parseNum(scaleY, selectedObject.scaleY),
      rotation: (rot * Math.PI) / 180,
      anchorX: parseNum(anchorX, selectedObject.anchorX),
      anchorY: parseNum(anchorY, selectedObject.anchorY),
      collision
    });
  };

  return (
    <aside
      id="sidebar-right"
      className={`fixed md:static inset-y-0 right-0 w-72 bg-[#1a1d24] border-l border-[#2d3342] flex flex-col z-40 transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}
    >
      {/* Header */}
      <div className="h-10 px-3 bg-[#21252f] border-b border-[#2d3342] flex items-center justify-between">
        <span className="font-semibold text-xs text-[#f0f3f8] flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-400" /> Inspetor de Propriedades
        </span>
        <button
          onClick={onClose}
          className="md:hidden text-[#9ba3b4] hover:text-[#f0f3f8] text-sm px-1.5 py-0.5 rounded"
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Selected Object Section */}
        <div className="bg-[#21252f] rounded-lg border border-[#2d3342] overflow-hidden">
          <div className="px-3 py-2 bg-[#282d39] border-b border-[#2d3342] font-semibold text-xs text-[#f0f3f8]">
            Objeto Selecionado
          </div>

          {selectedObject ? (
            <div className="p-3 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9ba3b4]">ID:</span>
                <span className="font-mono text-blue-400 text-[11px] truncate max-w-[140px]">
                  {selectedObject.id}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#9ba3b4]">Asset:</span>
                <span className="font-semibold text-[#f0f3f8] text-[11px]">{selectedObject.asset}</span>
              </div>

              {/* Pos X & Pos Y */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Posição X</label>
                  <input
                    type="number"
                    value={posX}
                    onChange={e => setPosX(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Posição Y</label>
                  <input
                    type="number"
                    value={posY}
                    onChange={e => setPosY(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Scale X & Scale Y */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Escala X</label>
                  <input
                    type="number"
                    step="0.05"
                    value={scaleX}
                    onChange={e => setScaleX(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Escala Y</label>
                  <input
                    type="number"
                    step="0.05"
                    value={scaleY}
                    onChange={e => setScaleY(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="text-[10px] text-[#9ba3b4] font-medium">Rotação (Graus)</label>
                <input
                  type="number"
                  value={rotDeg}
                  onChange={e => setRotDeg(e.target.value)}
                  onBlur={handleApplyTransform}
                  className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Anchor Foot */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Âncora X (Foot)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={anchorX}
                    onChange={e => setAnchorX(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9ba3b4] font-medium">Âncora Y (Foot)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={anchorY}
                    onChange={e => setAnchorY(e.target.value)}
                    onBlur={handleApplyTransform}
                    className="w-full mt-0.5 px-2 py-1 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Collision Toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#9ba3b4]">Colisão Habilitada</span>
                <input
                  type="checkbox"
                  checked={collision}
                  onChange={e => {
                    setCollision(e.target.checked);
                    if (selectedObject) {
                      updateSelectedTransform({ collision: e.target.checked });
                    }
                  }}
                  className="rounded border-[#2d3342] text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Delete Button */}
              <button
                onClick={deleteSelectedObject}
                className="w-full mt-2 py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover Objeto (Del)
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[#677184]">
              Nenhum objeto selecionado.<br />
              Clique em um objeto com a ferramenta Selecionar (V).
            </div>
          )}
        </div>

        {/* Procedural Generators */}
        <div className="bg-[#21252f] rounded-lg border border-[#2d3342] overflow-hidden">
          <div className="px-3 py-2 bg-[#282d39] border-b border-[#2d3342] font-semibold text-xs text-[#f0f3f8] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Geradores Automáticos
          </div>
          <div className="p-3 space-y-2">
            <button
              onClick={generateForest}
              className="w-full py-1.5 px-2 bg-[#282d39] hover:bg-[#323847] border border-[#2d3342] rounded text-xs font-medium text-[#f0f3f8] flex items-center justify-center gap-2 transition-colors"
            >
              <Trees className="w-4 h-4 text-emerald-400" /> Gerar Floresta Automática
            </button>
            <button
              onClick={generateRocks}
              className="w-full py-1.5 px-2 bg-[#282d39] hover:bg-[#323847] border border-[#2d3342] rounded text-xs font-medium text-[#f0f3f8] flex items-center justify-center gap-2 transition-colors"
            >
              <Mountain className="w-4 h-4 text-amber-400" /> Gerar Campo de Pedras
            </button>
          </div>
        </div>

        {/* Hierarchy List */}
        <div className="bg-[#21252f] rounded-lg border border-[#2d3342] overflow-hidden flex flex-col max-h-64">
          <div className="px-3 py-2 bg-[#282d39] border-b border-[#2d3342] font-semibold text-xs text-[#f0f3f8] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-blue-400" /> Objetos no Mapa
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1d24] text-[#9ba3b4] font-mono">
              {map.objects.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-1 divide-y divide-[#2d3342]/40">
            {map.objects.map(obj => {
              const isSelected = state.selectedObjectId === obj.id;
              return (
                <button
                  key={obj.id}
                  onClick={() => setSelectedObject(obj.id)}
                  className={`w-full px-2 py-1.5 text-left text-xs flex items-center justify-between rounded transition-colors ${
                    isSelected ? 'bg-blue-950/70 text-blue-300 font-semibold' : 'text-[#9ba3b4] hover:bg-[#282d39] hover:text-[#f0f3f8]'
                  }`}
                >
                  <span className="truncate">{obj.asset}</span>
                  <span className="text-[10px] text-[#677184] font-mono ml-2 shrink-0">
                    ({Math.round(obj.x)}, {Math.round(obj.y)})
                  </span>
                </button>
              );
            })}
            {map.objects.length === 0 && (
              <div className="p-3 text-center text-xs text-[#677184]">Nenhum objeto adicionado.</div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
