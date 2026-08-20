/**
 * src/components/HelpModal.tsx
 * Dialog popup showing keyboard shortcuts and touch gesture guide.
 */

import React from 'react';
import { HelpCircle, X, Keyboard, Smartphone } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'B', desc: 'Ferramenta Pincel de Terreno' },
    { key: 'F', desc: 'Balde de Preenchimento de Terreno' },
    { key: 'O', desc: 'Colocar Objeto / Sprite Selecionado' },
    { key: 'R', desc: 'Scatter Brush (Dispersão Orgânica)' },
    { key: 'V', desc: 'Selecionar / Mover Objeto' },
    { key: 'E', desc: 'Borracha de Objetos' },
    { key: 'H', desc: 'Mãozinha / Pan da Câmera' },
    { key: 'G', desc: 'Alternar Grade de Tiles' },
    { key: 'C', desc: 'Alternar Caixas de Colisão' },
    { key: 'P', desc: 'Ativar / Desativar Modo Jogador' },
    { key: 'Ctrl + Z', desc: 'Desfazer Última Ação' },
    { key: 'Ctrl + Y', desc: 'Refazer Ação' },
    { key: 'Del', desc: 'Excluir Objeto Selecionado' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#21252f] border border-[#2d3342] rounded-xl shadow-2xl w-full max-w-md overflow-hidden select-none">
        {/* Header */}
        <div className="px-4 py-3 bg-[#282d39] border-b border-[#2d3342] flex items-center justify-between">
          <span className="font-semibold text-sm text-[#f0f3f8] flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-400" /> Atalhos de Teclado & Gestos
          </span>
          <button onClick={onClose} className="text-[#9ba3b4] hover:text-[#f0f3f8] p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-[#f0f3f8] flex items-center gap-1.5 mb-2">
              <Keyboard className="w-3.5 h-3.5 text-blue-400" /> Teclas Rápidas
            </div>
            <div className="bg-[#1a1d24] rounded-lg border border-[#2d3342] divide-y divide-[#2d3342]/40 text-xs">
              {shortcuts.map(s => (
                <div key={s.key} className="px-3 py-1.5 flex justify-between items-center">
                  <span className="text-[#9ba3b4]">{s.desc}</span>
                  <span className="px-1.5 py-0.5 bg-[#282d39] border border-[#3d4558] rounded text-[11px] font-mono text-[#f0f3f8]">
                    {s.key}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#f0f3f8] flex items-center gap-1.5 mb-2">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Touch & Mobile
            </div>
            <div className="bg-[#1a1d24] rounded-lg border border-[#2d3342] p-3 text-xs text-[#9ba3b4] space-y-1">
              <p>• <strong>Pan:</strong> Arraste com 2 dedos ou use a ferramenta Mãozinha (H).</p>
              <p>• <strong>Pinch-to-Zoom:</strong> Aproxime ou afaste 2 dedos na tela para zoom focal.</p>
              <p>• <strong>D-Pad Touch:</strong> Ao ativar o Modo Jogador (P), use o controle direcional na tela para caminhar pelo mapa com colisão real.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#282d39] border-t border-[#2d3342] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-sm transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
