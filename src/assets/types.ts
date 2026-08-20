/**
 * src/assets/types.ts
 * Type definitions for terrain tiles, objects, custom assets, and Asset Repository.
 */

import * as PIXI from 'pixi.js';

export interface CollisionBoxDef {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface TerrainAsset {
  id: string;
  name: string;
  tileWidth: number;
  tileHeight: number;
  canvas: HTMLCanvasElement;
  texture: PIXI.Texture;
}

export interface ObjectAsset {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  collision: boolean;
  collisionBox: CollisionBoxDef;
  canvas: HTMLCanvasElement;
  texture: PIXI.Texture;
}

export interface IAssetRepository {
  init(): Promise<void>;
  getTerrain(id: string): TerrainAsset | undefined;
  getObjectDef(id: string): ObjectAsset | undefined;
  getAllTerrains(): TerrainAsset[];
  getAllObjects(): ObjectAsset[];
  getTerrainThumbnail(id: string): string;
  getObjectThumbnail(id: string): string;
  loadCustomImage(
    file: File,
    type?: 'terrain' | 'object',
    name?: string
  ): Promise<{ type: 'terrain' | 'object'; id: string; name: string }>;
}
