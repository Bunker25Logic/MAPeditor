/**
 * MapSerializer.js
 * Serializes and deserializes the Map state to/from clean JSON.
 * Exports map data and high-resolution PNG previews.
 */

import * as PIXI from 'pixi.js';

export class MapSerializer {
  /**
   * Serializes current map instance to clean JSON format
   */
  static toJSON(map) {
    return {
      version: map.version || 1,
      tileSize: map.tileSize,
      chunkSize: map.chunkSize,
      width: map.width,
      height: map.height,
      terrain: map.terrain,
      objects: map.objects.map(obj => ({
        id: obj.id,
        asset: obj.asset,
        x: Math.round(obj.x),
        y: Math.round(obj.y),
        scaleX: Number(obj.scaleX.toFixed(2)),
        scaleY: Number(obj.scaleY.toFixed(2)),
        rotation: Number(obj.rotation.toFixed(3)),
        anchorX: obj.anchorX,
        anchorY: obj.anchorY,
        collision: Boolean(obj.collision),
        collisionBox: obj.collisionBox ? { ...obj.collisionBox } : undefined,
        customProps: obj.customProps && Object.keys(obj.customProps).length > 0 ? obj.customProps : undefined
      }))
    };
  }

  /**
   * Validates and parses JSON string or object
   */
  static fromJSON(jsonData) {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

    if (!data || !Array.isArray(data.terrain) || !Array.isArray(data.objects)) {
      throw new Error('Arquivo JSON inválido: esperado campos "terrain" e "objects".');
    }

    return {
      version: data.version || 1,
      tileSize: data.tileSize || 32,
      chunkSize: data.chunkSize || 32,
      width: data.width || (data.terrain[0] ? data.terrain[0].length : 64),
      height: data.height || data.terrain.length,
      terrain: data.terrain,
      objects: data.objects
    };
  }

  /**
   * Triggers a browser download of the map JSON
   */
  static downloadJSON(map, filename = 'mmo_map.json') {
    const data = this.toJSON(map);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Exports full map as PNG image using PixiJS renderer
   */
  static exportPNG(pixiApp, stage, filename = 'map_screenshot.png') {
    try {
      const renderTexture = PIXI.RenderTexture.create({
        width: pixiApp.screen.width,
        height: pixiApp.screen.height
      });
      pixiApp.renderer.render(stage, { renderTexture });
      const canvas = pixiApp.renderer.extract.canvas(renderTexture);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        renderTexture.destroy(true);
      });
    } catch (err) {
      console.error('Falha ao exportar imagem:', err);
    }
  }
}
