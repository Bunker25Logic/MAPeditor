/**
 * src/components/NewMapModal.tsx
 * Dialog popup for configuring and creating a new map.
 */

import React, { useState } from 'react';
import { useEditor } from '../core/EditorContext';
import { Plus, X } from 'lucide-react';

interface NewMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewMapModal: React.FC<NewMapModalProps> = ({ isOpen, onClose }) => {
  const { createNewMap } = useEditor();
  const [width, setWidth] = useState('64');
  const [height, setHeight] = useState('64');
  const [terrain, setTerrain] = useState('grass');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Math.max(16, Math.min(256, parseInt(width, 10) || 64));
    const h = Math.max(16, Math.min(256, parseInt(height, 10) || 64));
    createNewMap(w, h, terrain);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#21252f] border border-[#2d3342] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden select-none">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#282d39] border-b border-[#2d3342] flex items-center justify-between">
          <span className="font-semibold text-sm text-[#f0f3f8] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-400" /> Criar Novo Mapa
          </span>
          <button onClick={onClose} className="text-[#9ba3b4] hover:text-[#f0f3f8] p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreate} className="p-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#9ba3b4]">Largura (Tiles)</label>
              <input
                type="number"
                min="16"
                max="256"
                value={width}
                onChange={e => setWidth(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9ba3b4]">Altura (Tiles)</label>
              <input
                type="number"
                min="16"
                max="256"
                value={height}
                onChange={e => setHeight(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#9ba3b4]">Terreno Base Inicial</label>
            <select
              value={terrain}
              onChange={e => setTerrain(e.target.value)}
              className="w-full mt-1 px-3 py-1.5 bg-[#1a1d24] border border-[#2d3342] rounded text-xs text-[#f0f3f8] focus:border-blue-500 focus:outline-none"
            >
              <option value="grass">Grama Verde (Padrão RPG)</option>
              <option value="dirt">Terra Batida</option>
              <option value="stone">Paralelepípedo / Pedra</option>
              <option value="sand">Areia Desértica</option>
              <option value="snow">Neve Fria</option>
              <option value="water">Água Profunda</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#282d39] hover:bg-[#323847] text-[#9ba3b4] hover:text-[#f0f3f8] text-xs font-medium rounded border border-[#2d3342] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-sm transition-colors"
            >
              Criar Mapa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
