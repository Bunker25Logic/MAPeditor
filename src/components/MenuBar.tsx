/**
 * src/components/MenuBar.tsx
 * Top navigation bar with menu dropdowns and quick actions.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '../core/EditorContext';
import {
  FolderOpen,
  Save,
  Download,
  Image,
  Undo2,
  Redo2,
  Sparkles,
  Grid,
  Shield,
  Footprints,
  Layers,
  Gamepad2,
  HelpCircle,
  Plus
} from 'lucide-react';

interface MenuBarProps {
  onOpenNewMapModal: () => void;
  onOpenHelpModal: () => void;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenNewMapModal,
  onOpenHelpModal,
  onToggleLeftSidebar,
  onToggleRightSidebar
}) => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    saveMapJSON,
    loadMapData,
    exportPNG,
    fillAllTerrain,
    clearAllObjects,
    generateForest,
    generateRocks,
    centerCamera,
    editorState,
    state
  } = useEditor();

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, menuId: string) => {
    e.stopPropagation();
    setActiveDropdown(prev => (prev === menuId ? null : menuId));
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        loadMapData(json);
      } catch (err) {
        alert('Erro ao importar JSON: arquivo inválido.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header
      id="menu-bar"
      className="h-10 bg-[#1a1d24] border-b border-[#2d3342] flex items-center justify-between px-3 z-50 select-none"
    >
      <div className="flex items-center gap-1">
        {/* Mobile Sidebar Toggles */}
        <button
          onClick={onToggleLeftSidebar}
          className="md:hidden flex items-center gap-1 px-2 py-1 bg-[#282d39] hover:bg-[#323847] text-[#9ba3b4] hover:text-[#f0f3f8] text-xs rounded border border-[#2d3342]"
          title="Abrir Paleta"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Paleta</span>
        </button>

        <div className="flex items-center gap-2 pr-3 mr-1 border-r border-[#2d3342] font-bold text-sm text-[#f0f3f8] tracking-wide">
          <span>MMO MAPPER</span>
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase">
            2D PRO
          </span>
        </div>

        {/* Menu Arquivo */}
        <div className="relative">
          <button
            onClick={e => toggleDropdown(e, 'file')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeDropdown === 'file'
                ? 'bg-[#3c4456] text-[#f0f3f8]'
                : 'text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
            }`}
          >
            Arquivo
          </button>
          {activeDropdown === 'file' && (
            <div
              className="absolute left-0 top-full mt-1 w-52 bg-[#21252f] border border-[#2d3342] rounded-md shadow-xl py-1 z-50"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  onOpenNewMapModal();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-blue-400" /> Novo Mapa...
                </span>
                <span className="text-[10px] text-[#677184]">Ctrl+N</span>
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  fileInputRef.current?.click();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400" /> Importar JSON...
                </span>
                <span className="text-[10px] text-[#677184]">Ctrl+O</span>
              </button>
              <div className="h-px bg-[#2d3342] my-1" />
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  saveMapJSON();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-blue-400" /> Salvar / Exportar JSON
                </span>
                <span className="text-[10px] text-[#677184]">Ctrl+S</span>
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  exportPNG();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Image className="w-3.5 h-3.5 text-purple-400" /> Exportar Imagem PNG
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Editar */}
        <div className="relative">
          <button
            onClick={e => toggleDropdown(e, 'edit')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeDropdown === 'edit'
                ? 'bg-[#3c4456] text-[#f0f3f8]'
                : 'text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
            }`}
          >
            Editar
          </button>
          {activeDropdown === 'edit' && (
            <div
              className="absolute left-0 top-full mt-1 w-52 bg-[#21252f] border border-[#2d3342] rounded-md shadow-xl py-1 z-50"
              onClick={e => e.stopPropagation()}
            >
              <button
                disabled={!canUndo}
                onClick={() => {
                  setActiveDropdown(null);
                  undo();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8] disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5" /> Desfazer
                </span>
                <span className="text-[10px] text-[#677184]">Ctrl+Z</span>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => {
                  setActiveDropdown(null);
                  redo();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8] disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5" /> Refazer
                </span>
                <span className="text-[10px] text-[#677184]">Ctrl+Y</span>
              </button>
              <div className="h-px bg-[#2d3342] my-1" />
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  fillAllTerrain(state.selectedTerrainId);
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span>Preencher Todo o Terreno</span>
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  clearAllObjects();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-rose-400"
              >
                <span>Limpar Todos os Objetos</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Mapa */}
        <div className="relative">
          <button
            onClick={e => toggleDropdown(e, 'map')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeDropdown === 'map'
                ? 'bg-[#3c4456] text-[#f0f3f8]'
                : 'text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
            }`}
          >
            Mapa
          </button>
          {activeDropdown === 'map' && (
            <div
              className="absolute left-0 top-full mt-1 w-52 bg-[#21252f] border border-[#2d3342] rounded-md shadow-xl py-1 z-50"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  generateForest();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[#323847] text-[#f0f3f8]"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gerar Floresta Automática</span>
              </button>
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  generateRocks();
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-[#323847] text-[#f0f3f8]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerar Pedras Automáticas</span>
              </button>
              <div className="h-px bg-[#2d3342] my-1" />
              <button
                onClick={() => {
                  setActiveDropdown(null);
                  centerCamera();
                }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#323847] text-[#f0f3f8]"
              >
                Centralizar Câmera no Mapa
              </button>
            </div>
          )}
        </div>

        {/* Menu Visualizar */}
        <div className="relative">
          <button
            onClick={e => toggleDropdown(e, 'view')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              activeDropdown === 'view'
                ? 'bg-[#3c4456] text-[#f0f3f8]'
                : 'text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39]'
            }`}
          >
            Visualizar
          </button>
          {activeDropdown === 'view' && (
            <div
              className="absolute left-0 top-full mt-1 w-56 bg-[#21252f] border border-[#2d3342] rounded-md shadow-xl py-1 z-50"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  editorState.toggleGrid();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" /> Grade de Tiles
                </span>
                <span className="text-[10px] text-blue-400">{state.gridVisible ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => {
                  editorState.toggleCollision();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Colisões
                </span>
                <span className="text-[10px] text-blue-400">{state.collisionVisible ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={() => {
                  editorState.toggleAnchors();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-[#f0f3f8]"
              >
                <span className="flex items-center gap-2">
                  <Footprints className="w-3.5 h-3.5" /> Pontos de Âncora
                </span>
                <span className="text-[10px] text-blue-400">{state.anchorsVisible ? 'ON' : 'OFF'}</span>
              </button>
              <div className="h-px bg-[#2d3342] my-1" />
              <button
                onClick={() => {
                  editorState.togglePlayerMode();
                  setActiveDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-[#323847] text-emerald-400"
              >
                <span className="flex items-center gap-2">
                  <Gamepad2 className="w-3.5 h-3.5" /> Teste Jogador (P)
                </span>
                <span className="text-[10px]">{state.playerMode ? 'ATIVO' : 'DESATIVADO'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Menu Ajuda */}
        <button
          onClick={onOpenHelpModal}
          className="px-2.5 py-1 text-xs text-[#9ba3b4] hover:text-[#f0f3f8] hover:bg-[#282d39] rounded transition-colors"
        >
          Ajuda
        </button>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleRightSidebar}
          className="md:hidden flex items-center gap-1 px-2 py-1 bg-[#282d39] hover:bg-[#323847] text-[#9ba3b4] hover:text-[#f0f3f8] text-xs rounded border border-[#2d3342]"
          title="Abrir Inspetor"
        >
          <span>Inspetor</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportJSON}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#282d39] hover:bg-[#323847] text-[#f0f3f8] text-xs rounded border border-[#2d3342] font-medium transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Importar</span>
        </button>

        <button
          onClick={saveMapJSON}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar</span>
        </button>
      </div>
    </header>
  );
};
