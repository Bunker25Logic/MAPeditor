/**
 * main.js
 * Application entry point for the MMO 2D Map Editor.
 */

import * as PIXI from 'pixi.js';
import '../css/editor.css';
import { Editor } from './Editor.js';

// Expose PIXI globally for legacy / debug access
window.PIXI = PIXI;

async function startEditor() {
  try {
    const editor = new Editor();
    window.mapEditor = editor; // Expose to window for UI buttons / debugging
    await editor.init();
    console.log('MMO 2D Map Editor initialized successfully.');
  } catch (err) {
    console.error('Error initializing map editor:', err);
    const container = document.getElementById('viewport-container');
    if (container) {
      const errBox = document.createElement('div');
      errBox.style.cssText = 'position:absolute;top:20px;left:20px;right:20px;padding:16px;background:#7f1d1d;color:#fecaca;border-radius:8px;font-family:monospace;font-size:12px;z-index:9999;';
      errBox.innerHTML = `<strong>Falha ao inicializar o editor:</strong><br>${err.message}<br><pre>${err.stack}</pre>`;
      container.appendChild(errBox);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startEditor);
} else {
  startEditor();
}

