/**
 * src/components/PaletteSidebar.tsx
 * Left sidebar for selecting Terrains, Objects and importing custom assets.
 * Renders real PNG texture previews without emojis.
 */

import React, { useState, useEffect } from 'react';
import { useEditor } from '../core/EditorContext';
import { Upload, Layers, Image as ImageIcon, Box } from 'lucide-react';

const TERRAINS = [
  { id: 'grass', name: 'Grama Verde', category: 'Natureza', color: '#2d6a4f' },
  { id: 'dirt', name: 'Terra Batida', category: 'Caminho', color: '#7f5539' },
  { id: 'stone', name: 'Paralelepípedo', category: 'Construção', color: '#6c757d' },
  { id: 'water', name: 'Água Profunda', category: 'Líquidos', color: '#1d3557' },
  { id: 'sand', name: 'Areia da Praia', category: 'Natureza', color: '#ddb892' },
  { id: 'snow', name: 'Neve Fria', category: 'Natureza', color: '#e0e1dd' },
  { id: 'wood_floor', name: 'Piso de Madeira', category: 'Construção', color: '#9c6644' },
  { id: 'marsh', name: 'Pântano Úmido', category: 'Natureza', color: '#3f4f24' }
];

const OBJECTS = [
  { id: 'tree_oak', name: 'Carvalho Alto', category: 'Vegetação', size: '96x128' },
  { id: 'tree_pine', name: 'Pinheiro Selvagem', category: 'Vegetação', size: '64x140' },
  { id: 'tree_dead', name: 'Árvore Seca', category: 'Vegetação', size: '80x110' },
  { id: 'bush', name: 'Arbusto Frondoso', category: 'Vegetação', size: '48x40' },
  { id: 'rock_large', name: 'Pedra Grande', category: 'Ambiente', size: '64x56' },
  { id: 'rock_small', name: 'Pedregulho', category: 'Ambiente', size: '36x28' },
  { id: 'house_wood', name: 'Casa Rústica', category: 'Construção', size: '160x160' },
  { id: 'lamp_post', name: 'Poste Medieval', category: 'Decoração', size: '32x96' },
  { id: 'fence_wood', name: 'Cerca de Madeira', category: 'Decoração', size: '64x36' },
  { id: 'barrel', name: 'Barril de Madeira', category: 'Objetos', size: '32x40' },
  { id: 'chest', name: 'Baú do Tesouro', category: 'Objetos', size: '36x32' },
  { id: 'npc_knight', name: 'Cavaleiro Guardião', category: 'Personagens', size: '40x56' }
];

export const PaletteSidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { state, setSelectedTerrain, setSelectedAsset, setTool, renderer } = useEditor();
  const [activeTab, setActiveTab] = useState<'terrain' | 'objects'>('terrain');
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const [customObjectsList, setCustomObjectsList] = useState<Array<{ id: string; name: string; category: string; size: string }>>([]);

  // Fetch real PNG thumbnails and dynamic objects from AssetManager
  const refreshAssets = () => {
    const map: { [key: string]: string } = {};
    if (renderer && renderer.assetManager) {
      for (const t of TERRAINS) {
        const thumb = renderer.assetManager.getTerrainThumbnail(t.id);
        if (thumb) map[`t_${t.id}`] = thumb;
      }
      for (const obj of OBJECTS) {
        const thumb = renderer.assetManager.getObjectThumbnail(obj.id);
        if (thumb) map[`o_${obj.id}`] = thumb;
      }

      // Read custom objects from asset manager
      const allRegistered = renderer.assetManager.getAllObjects();
      const customOnes: Array<{ id: string; name: string; category: string; size: string }> = [];
      for (const reg of allRegistered) {
        if (reg.id.startsWith('custom_')) {
          const thumb = renderer.assetManager.getObjectThumbnail(reg.id);
          if (thumb) map[`o_${reg.id}`] = thumb;
          customOnes.push({
            id: reg.id,
            name: reg.name,
            category: reg.category || 'Importados',
            size: `${reg.width}x${reg.height}`
          });
        }
      }
      setCustomObjectsList(customOnes);
      setThumbnails(map);
    }
  };

  useEffect(() => {
    refreshAssets();
  }, [renderer]);

  const handleSelectTerrain = (id: string) => {
    setSelectedTerrain(id);
    if (state.activeTool !== 'paint' && state.activeTool !== 'fill') {
      setTool('paint');
    }
  };

  const handleSelectObject = (id: string) => {
    setSelectedAsset(id);
    if (state.activeTool !== 'object' && state.activeTool !== 'scatter') {
      setTool('object');
    }
  };

  const allDisplayObjects = [...OBJECTS, ...customObjectsList];

  return (
    <aside
      id="sidebar-left"
      className={`fixed md:static inset-y-0 left-0 w-72 bg-[#1a1d24] border-r border-[#2d3342] flex flex-col z-40 transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Header */}
      <div className="h-10 px-3 bg-[#21252f] border-b border-[#2d3342] flex items-center justify-between">
        <span className="font-semibold text-xs text-[#f0f3f8] flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Paleta de Recursos PNG
        </span>
        <button
          onClick={onClose}
          className="md:hidden text-[#9ba3b4] hover:text-[#f0f3f8] text-sm px-1.5 py-0.5 rounded"
        >
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#2d3342] bg-[#1a1d24]">
        <button
          onClick={() => setActiveTab('terrain')}
          className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-colors border-b-2 ${
            activeTab === 'terrain'
              ? 'border-blue-500 text-blue-400 bg-[#21252f]'
              : 'border-transparent text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
          }`}
        >
          TILES DE TERRENO
        </button>
        <button
          onClick={() => setActiveTab('objects')}
          className={`flex-1 py-2 text-xs font-semibold tracking-wide transition-colors border-b-2 ${
            activeTab === 'objects'
              ? 'border-blue-500 text-blue-400 bg-[#21252f]'
              : 'border-transparent text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
          }`}
        >
          OBJETOS & SPRITES
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'terrain' ? (
          <div className="grid grid-cols-2 gap-2">
            {TERRAINS.map(t => {
              const isSelected = state.selectedTerrainId === t.id;
              const thumbUrl = thumbnails[`t_${t.id}`];
              return (
                <button
                  key={t.id}
                  onClick={() => handleSelectTerrain(t.id)}
                  className={`p-2 rounded-lg text-left flex items-center gap-2.5 border transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-400/50 shadow-md'
                      : 'bg-[#282d39] border-[#2d3342] hover:bg-[#323847] hover:border-[#3d4558]'
                  }`}
                >
                  <div className="w-8 h-8 rounded border border-[#3d4558] overflow-hidden bg-[#121418] shrink-0 flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={t.name}
                        className="w-full h-full object-cover [image-rendering:pixelated]"
                      />
                    ) : (
                      <div className="w-full h-full" style={{ backgroundColor: t.color }} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#f0f3f8] truncate">{t.name}</div>
                    <div className="text-[10px] text-[#9ba3b4] truncate">{t.category}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {allDisplayObjects.map(obj => {
              const isSelected = state.selectedObjectAsset === obj.id;
              const thumbUrl = thumbnails[`o_${obj.id}`];
              return (
                <button
                  key={obj.id}
                  onClick={() => handleSelectObject(obj.id)}
                  className={`p-2 rounded-lg text-left flex flex-col gap-1.5 border transition-all ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-400/50 shadow-md'
                      : 'bg-[#282d39] border-[#2d3342] hover:bg-[#323847] hover:border-[#3d4558]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded border border-[#3d4558] overflow-hidden bg-[#121418] p-0.5 flex items-center justify-center shrink-0">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={obj.name}
                          className="max-w-full max-h-full object-contain [image-rendering:pixelated]"
                        />
                      ) : (
                        <Box className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-[#21252f] text-[#9ba3b4] font-mono">
                      {obj.size}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#f0f3f8] truncate">{obj.name}</div>
                    <div className="text-[10px] text-[#9ba3b4] truncate">{obj.category}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Upload Section */}
        <div className="pt-3 border-t border-[#2d3342] space-y-2">
          <div className="text-[11px] font-semibold text-[#9ba3b4] uppercase tracking-wider">
            Importar Imagem PNG / JPG
          </div>

          <label className="flex items-center gap-2 p-2 rounded bg-[#21252f] border border-dashed border-[#3d4558] hover:border-blue-400 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-medium text-[#f0f3f8]">+ Carregar Arquivo de Imagem</div>
              <div className="text-[10px] text-[#677184]">Tiles 32x32 ou Sprites com Alpha</div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (file) {
                  const type = activeTab === 'terrain' ? 'terrain' : 'object';
                  const res = await renderer.assetManager.loadCustomImage(file, type);

                  if (res && res.id) {
                    if (type === 'terrain') {
                      setSelectedTerrain(res.id);
                      setTool('paint');
                    } else {
                      setSelectedAsset(res.id);
                      setTool('object');
                    }
                    refreshAssets();
                  }
                }
              }}
            />
          </label>
        </div>
      </div>
    </aside>
  );
};
