/**
 * src/App.tsx
 * Main Map Editor React Application root uniting EditorProvider, MenuBar, Toolbar, Palette, Viewport, Inspector and Status bar.
 */

import React, { useState, useEffect } from 'react';
import { EditorProvider, useEditor } from './core/EditorContext';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { PaletteSidebar } from './components/PaletteSidebar';
import { InspectorSidebar } from './components/InspectorSidebar';
import { Viewport } from './components/Viewport';
import { StatusBar } from './components/StatusBar';
import { NewMapModal } from './components/NewMapModal';
import { HelpModal } from './components/HelpModal';

const EditorLayout: React.FC = () => {
  const { setTool, editorState, undo, redo, deleteSelectedObject } = useEditor();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedObject();
      } else if (e.key.toLowerCase() === 'b') {
        setTool('paint');
      } else if (e.key.toLowerCase() === 'f') {
        setTool('fill');
      } else if (e.key.toLowerCase() === 'o') {
        setTool('object');
      } else if (e.key.toLowerCase() === 'r') {
        setTool('scatter');
      } else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'e') {
        setTool('eraser');
      } else if (e.key.toLowerCase() === 'h') {
        setTool('hand');
      } else if (e.key.toLowerCase() === 'g') {
        editorState.toggleGrid();
      } else if (e.key.toLowerCase() === 'c') {
        editorState.toggleCollision();
      } else if (e.key.toLowerCase() === 'p') {
        editorState.togglePlayerMode();
      } else if (e.key === '?') {
        setIsHelpModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, editorState, undo, redo, deleteSelectedObject]);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#121418] text-[#f0f3f8] overflow-hidden select-none font-sans">
      {/* Top Menu Bar */}
      <MenuBar
        onOpenNewMapModal={() => setIsNewMapModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(prev => !prev)}
        onToggleRightSidebar={() => setIsRightSidebarOpen(prev => !prev)}
      />

      {/* Main Action Toolbar */}
      <Toolbar />

      {/* Center Workspace (Palettes + Pixi Viewport + Inspector) */}
      <main className="relative flex-1 flex overflow-hidden">
        {/* Backdrop for Mobile Drawers */}
        {(isLeftSidebarOpen || isRightSidebarOpen) && (
          <div
            onClick={() => {
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}

        {/* Left Resource Palette */}
        <PaletteSidebar
          isOpen={isLeftSidebarOpen}
          onClose={() => setIsLeftSidebarOpen(false)}
        />

        {/* Center Canvas Viewport */}
        <Viewport />

        {/* Right Inspector & Hierarchy */}
        <InspectorSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
        />
      </main>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals */}
      <NewMapModal
        isOpen={isNewMapModalOpen}
        onClose={() => setIsNewMapModalOpen(false)}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
