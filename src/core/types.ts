/**
 * src/core/types.ts
 * Core domain types, interfaces and enums for 2D Map Editor.
 * Completely independent of rendering (PixiJS) and UI (React/DOM).
 */

export type EditorTool =
  | 'select'
  | 'paint'
  | 'eraser'
  | 'fill'
  | 'object'
  | 'scatter'
  | 'collision'
  | 'hand';

export type EditorLayer = 'terrain' | 'objects' | 'collision';

export interface CollisionBox {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface MapObject {
  id: string;
  asset: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  anchorX: number;
  anchorY: number;
  collision: boolean;
  collisionBox?: CollisionBox | null;
  customProps: Record<string, unknown>;
}

export interface ObjectDefinition {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  collision: boolean;
  collisionBox: {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
  };
  renderCategory?: 'ground' | 'terrain' | 'entity' | 'object' | 'roof' | 'foreground';
}

export interface TerrainChunk {
  cx: number;
  cy: number;
  tiles: (string | null)[];
}

export interface CustomAssetData {
  id: string;
  type: 'terrain' | 'object';
  name: string;
  category?: string;
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  collision?: boolean;
  collisionBox?: CollisionBox;
  dataUrl: string;
}

export interface MapData {
  format: 'bunker25-map';
  version: number;
  editorVersion: string;
  width: number;
  height: number;
  tileSize: number;
  chunkSize: number;
  terrain: (string | null)[][];
  objects: MapObject[];
  collision: number[][];
  customAssets?: CustomAssetData[];
  metadata: {
    name?: string;
    createdAt?: string;
    modifiedAt?: string;
    author?: string;
    [key: string]: unknown;
  };
}

export interface EditorStateModel {
  activeTool: EditorTool;
  activeLayer: EditorLayer;
  selectedTerrainId: string;
  selectedObjectId: string | null;
  selectedObjectAsset: string;
  brushSize: number;
  gridVisible: boolean;
  collisionVisible: boolean;
  anchorsVisible: boolean;
  depthLinesVisible: boolean;
  playerMode: boolean;
  dirty: boolean;
}

export type EditorEvent =
  | { type: 'STATE_CHANGED'; state: Readonly<EditorStateModel> }
  | { type: 'TOOL_CHANGED'; tool: EditorTool }
  | { type: 'LAYER_CHANGED'; layer: EditorLayer }
  | { type: 'OBJECT_SELECTED'; objectId: string | null }
  | { type: 'MAP_MODIFIED' }
  | { type: 'MAP_RELOADED' };
