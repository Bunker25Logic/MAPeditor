/**
 * src/assets/AssetManager.ts
 * Procedural pixel art asset manager and texture repository in pure TypeScript.
 * Manages PIXI textures, thumbnail caches, and custom uploaded assets.
 */

import * as PIXI from 'pixi.js';
import { IAssetRepository, TerrainAsset, ObjectAsset, CollisionBoxDef } from './types';
import { CustomAssetData } from '../core/types';

export class AssetManager implements IAssetRepository {
  private terrains: Map<string, TerrainAsset> = new Map();
  private objects: Map<string, ObjectAsset> = new Map();
  private thumbnailCache: Map<string, string> = new Map();
  private customAssetsMap: Map<string, CustomAssetData> = new Map();
  public playerTexture: PIXI.Texture | null = null;
  public initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    // 1. Procedural Terrains (32x32)
    this.registerTerrain('grass', 'Grama Verde', this.createGrassTexture());
    this.registerTerrain('dirt', 'Terra Batida', this.createDirtTexture());
    this.registerTerrain('sand', 'Areia da Praia', this.createSandTexture());
    this.registerTerrain('stone', 'Paralelepípedo', this.createStoneTexture());
    this.registerTerrain('water', 'Água Profunda', this.createWaterTexture());
    this.registerTerrain('snow', 'Neve Fria', this.createSnowTexture());
    this.registerTerrain('wood_floor', 'Piso de Madeira', this.createWoodFloorTexture());
    this.registerTerrain('marsh', 'Pântano Úmido', this.createMarshTexture());

    // 2. Procedural Objects
    this.registerObject('tree_oak', {
      name: 'Carvalho Alto',
      category: 'Vegetação',
      width: 96,
      height: 128,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 26, height: 18, offsetX: 0, offsetY: -9 },
      canvas: this.createOakTreeTexture()
    });

    this.registerObject('tree_pine', {
      name: 'Pinheiro Selvagem',
      category: 'Vegetação',
      width: 64,
      height: 140,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 22, height: 16, offsetX: 0, offsetY: -8 },
      canvas: this.createPineTreeTexture()
    });

    this.registerObject('tree_dead', {
      name: 'Árvore Seca',
      category: 'Vegetação',
      width: 80,
      height: 110,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 22, height: 16, offsetX: 0, offsetY: -8 },
      canvas: this.createDeadTreeTexture()
    });

    this.registerObject('bush', {
      name: 'Arbusto Frondoso',
      category: 'Vegetação',
      width: 48,
      height: 40,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 38, height: 24, offsetX: 0, offsetY: -12 },
      canvas: this.createBushTexture()
    });

    this.registerObject('rock_large', {
      name: 'Pedra Grande',
      category: 'Ambiente',
      width: 64,
      height: 56,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 50, height: 28, offsetX: 0, offsetY: -14 },
      canvas: this.createLargeRockTexture()
    });

    this.registerObject('rock_small', {
      name: 'Pedregulho',
      category: 'Ambiente',
      width: 36,
      height: 28,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 28, height: 18, offsetX: 0, offsetY: -9 },
      canvas: this.createSmallRockTexture()
    });

    this.registerObject('house_wood', {
      name: 'Casa Rústica',
      category: 'Construção',
      width: 160,
      height: 160,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 140, height: 75, offsetX: 0, offsetY: -38 },
      canvas: this.createHouseTexture()
    });

    this.registerObject('lamp_post', {
      name: 'Poste Medieval',
      category: 'Decoração',
      width: 32,
      height: 96,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 16, height: 12, offsetX: 0, offsetY: -6 },
      canvas: this.createLampPostTexture()
    });

    this.registerObject('fence_wood', {
      name: 'Cerca de Madeira',
      category: 'Decoração',
      width: 64,
      height: 36,
      anchorX: 0.5,
      anchorY: 0.9,
      collision: true,
      collisionBox: { width: 60, height: 14, offsetX: 0, offsetY: -7 },
      canvas: this.createFenceTexture()
    });

    this.registerObject('barrel', {
      name: 'Barril de Madeira',
      category: 'Objetos',
      width: 32,
      height: 40,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 26, height: 22, offsetX: 0, offsetY: -11 },
      canvas: this.createBarrelTexture()
    });

    this.registerObject('chest', {
      name: 'Baú do Tesouro',
      category: 'Objetos',
      width: 36,
      height: 32,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 30, height: 22, offsetX: 0, offsetY: -11 },
      canvas: this.createChestTexture()
    });

    this.registerObject('npc_knight', {
      name: 'Cavaleiro Guardião',
      category: 'NPCs',
      width: 40,
      height: 56,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 24, height: 16, offsetX: 0, offsetY: -8 },
      canvas: this.createKnightTexture()
    });

    const playerCanvas = this.createPlayerTexture();
    this.playerTexture = PIXI.Texture.from(playerCanvas);

    this.initialized = true;
  }

  registerTerrain(id: string, name: string, canvas: HTMLCanvasElement): void {
    const texture = PIXI.Texture.from(canvas);
    this.terrains.set(id, {
      id,
      name,
      tileWidth: 32,
      tileHeight: 32,
      canvas,
      texture
    });
    this.thumbnailCache.set(`terrain_${id}`, canvas.toDataURL('image/png'));
  }

  registerObject(
    id: string,
    data: {
      name?: string;
      category?: string;
      width: number;
      height: number;
      anchorX?: number;
      anchorY?: number;
      collision?: boolean;
      collisionBox?: CollisionBoxDef;
      canvas: HTMLCanvasElement;
    }
  ): void {
    const texture = PIXI.Texture.from(data.canvas);
    this.objects.set(id, {
      id,
      name: data.name || id,
      category: data.category || 'Geral',
      width: data.width,
      height: data.height,
      anchorX: data.anchorX !== undefined ? data.anchorX : 0.5,
      anchorY: data.anchorY !== undefined ? data.anchorY : 1.0,
      collision: data.collision !== undefined ? data.collision : true,
      collisionBox: data.collisionBox || {
        width: Math.round(data.width * 0.6),
        height: 20,
        offsetX: 0,
        offsetY: -10
      },
      canvas: data.canvas,
      texture
    });
    this.thumbnailCache.set(`object_${id}`, data.canvas.toDataURL('image/png'));
  }

  getTerrain(id: string): TerrainAsset | undefined {
    return this.terrains.get(id) || this.terrains.get('grass');
  }

  getObjectDef(id: string): ObjectAsset | undefined {
    return this.objects.get(id);
  }

  getAllTerrains(): TerrainAsset[] {
    return Array.from(this.terrains.values());
  }

  getAllObjects(): ObjectAsset[] {
    return Array.from(this.objects.values());
  }

  getTerrainThumbnail(id: string): string {
    const cached = this.thumbnailCache.get(`terrain_${id}`);
    if (cached) return cached;
    const t = this.getTerrain(id);
    if (t?.canvas) {
      const url = t.canvas.toDataURL('image/png');
      this.thumbnailCache.set(`terrain_${id}`, url);
      return url;
    }
    return '';
  }

  getObjectThumbnail(id: string): string {
    const cached = this.thumbnailCache.get(`object_${id}`);
    if (cached) return cached;
    const obj = this.getObjectDef(id);
    if (obj?.canvas) {
      const url = obj.canvas.toDataURL('image/png');
      this.thumbnailCache.set(`object_${id}`, url);
      return url;
    }
    return '';
  }

  async loadCustomImage(
    file: File,
    type: 'terrain' | 'object' = 'object',
    name = ''
  ): Promise<{ type: 'terrain' | 'object'; id: string; name: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const id = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const assetName = name || file.name.replace(/\.[^/.]+$/, '');

          if (type === 'terrain') {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, 0, 0, 32, 32);
              this.registerTerrain(id, assetName, canvas);
              this.customAssetsMap.set(id, {
                id,
                type: 'terrain',
                name: assetName,
                width: 32,
                height: 32,
                dataUrl: canvas.toDataURL('image/png')
              });
              resolve({ type: 'terrain', id, name: assetName });
            } else {
              reject(new Error('Canvas context not available'));
            }
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);

              // Calculate heuristic collision box based on object dimensions
              const colBox = this.calculateHeuristicCollisionBox(img.width, img.height);

              this.registerObject(id, {
                name: assetName,
                category: 'Importados',
                width: img.width,
                height: img.height,
                anchorX: 0.5,
                anchorY: 0.95,
                collision: true,
                collisionBox: colBox,
                canvas
              });

              this.customAssetsMap.set(id, {
                id,
                type: 'object',
                name: assetName,
                category: 'Importados',
                width: img.width,
                height: img.height,
                anchorX: 0.5,
                anchorY: 0.95,
                collision: true,
                collisionBox: colBox,
                dataUrl
              });

              resolve({ type: 'object', id, name: assetName });
            } else {
              reject(new Error('Canvas context not available'));
            }
          }
        };
        img.onerror = reject;
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generates a sensible physical collisionBox representing the ground base of the object
   */
  public calculateHeuristicCollisionBox(width: number, height: number): CollisionBoxDef {
    // 1. Tall / vertical objects (trees, towers, lamp posts)
    if (height >= width * 1.25) {
      const boxW = Math.max(16, Math.min(width * 0.4, 48));
      const boxH = Math.max(14, Math.min(height * 0.18, 28));
      return {
        width: Math.round(boxW),
        height: Math.round(boxH),
        offsetX: 0,
        offsetY: -Math.round(boxH / 2)
      };
    }

    // 2. Wide structures / buildings
    if (width >= 80 && height >= 60) {
      const boxW = Math.round(width * 0.85);
      const boxH = Math.round(height * 0.45);
      return {
        width: boxW,
        height: boxH,
        offsetX: 0,
        offsetY: -Math.round(boxH / 2)
      };
    }

    // 3. Standard props, rocks, barrels, chests
    const boxW = Math.max(14, Math.round(width * 0.7));
    const boxH = Math.max(12, Math.round(height * 0.45));
    return {
      width: boxW,
      height: boxH,
      offsetX: 0,
      offsetY: -Math.round(boxH / 2)
    };
  }

  exportCustomAssets(): CustomAssetData[] {
    return Array.from(this.customAssetsMap.values());
  }

  async importCustomAssets(assets: CustomAssetData[]): Promise<void> {
    if (!assets || !Array.isArray(assets) || assets.length === 0) return;

    for (const asset of assets) {
      if (this.customAssetsMap.has(asset.id)) continue;

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (asset.type === 'terrain') {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, 0, 0, 32, 32);
              this.registerTerrain(asset.id, asset.name, canvas);
              this.customAssetsMap.set(asset.id, asset);
            }
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = asset.width || img.width;
            canvas.height = asset.height || img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const colBox = asset.collisionBox || this.calculateHeuristicCollisionBox(canvas.width, canvas.height);
              this.registerObject(asset.id, {
                name: asset.name,
                category: asset.category || 'Importados',
                width: canvas.width,
                height: canvas.height,
                anchorX: asset.anchorX ?? 0.5,
                anchorY: asset.anchorY ?? 0.95,
                collision: asset.collision ?? true,
                collisionBox: colBox,
                canvas
              });
              this.customAssetsMap.set(asset.id, asset);
            }
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = asset.dataUrl;
      });
    }
  }

  // Helper to create 2D canvas
  private createCanvas(w: number, h: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  /* ---------------- Procedural Textures ---------------- */

  private createGrassTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#3eb96b';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 16, 32, 16);

    const greens = ['#16a34a', '#15803d', '#86efac', '#22c55e', '#166534'];
    for (let x = 0; x < 32; x += 4) {
      for (let y = 0; y < 32; y += 4) {
        const color = greens[(x * 7 + y * 13) % greens.length];
        ctx.fillStyle = color;
        ctx.fillRect(x + (y % 3), y + 1, 2, 3);
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = '#bbf7d0';
          ctx.fillRect(x + 1, y, 1, 2);
        }
      }
    }
    ctx.fillStyle = 'rgba(21, 128, 61, 0.15)';
    ctx.strokeRect(0.5, 0.5, 31, 31);
    return canvas;
  }

  private createDirtTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, 32, 32);

    const dirtColors = ['#78350f', '#b45309', '#d97706', '#5c2b09', '#a16207'];
    for (let x = 0; x < 32; x += 3) {
      for (let y = 0; y < 32; y += 3) {
        const c = dirtColors[(x * 11 + y * 17) % dirtColors.length];
        ctx.fillStyle = c;
        ctx.fillRect(x + (y % 2), y, 2, 2);
        if ((x * y + 3) % 19 === 0) {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(x, y, 3, 2);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(x + 1, y - 1, 1, 1);
        }
      }
    }
    return canvas;
  }

  private createSandTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fde047';
    ctx.fillRect(0, 0, 32, 32);

    const sandColors = ['#eab308', '#facc15', '#ca8a04', '#fef08a'];
    for (let y = 0; y < 32; y += 4) {
      for (let x = 0; x < 32; x += 2) {
        ctx.fillStyle = sandColors[(x + y) % sandColors.length];
        ctx.fillRect(x + ((y / 4) % 2) * 2, y, 2, 1);
      }
    }
    return canvas;
  }

  private createStoneTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 32, 32);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillRect(17, 1, 14, 14);

    ctx.fillStyle = '#525e75';
    ctx.fillRect(1, 17, 7, 14);
    ctx.fillRect(10, 17, 14, 14);
    ctx.fillRect(26, 17, 5, 14);

    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.strokeRect(16.5, 0.5, 15, 15);
    ctx.strokeRect(0.5, 16.5, 8.5, 15);
    ctx.strokeRect(9.5, 16.5, 15, 15);
    ctx.strokeRect(25.5, 16.5, 6, 15);
    return canvas;
  }

  private createWaterTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 8, 32, 4);
    ctx.fillRect(0, 22, 32, 4);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(4, 3, 6, 2);
    ctx.fillRect(20, 5, 8, 2);
    ctx.fillRect(10, 16, 8, 2);
    ctx.fillRect(24, 18, 5, 2);
    ctx.fillRect(2, 27, 8, 2);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(6, 4, 2, 1);
    ctx.fillRect(12, 17, 3, 1);
    return canvas;
  }

  private createSnowTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#e2e8f0';
    for (let x = 0; x < 32; x += 4) {
      for (let y = 0; y < 32; y += 4) {
        if ((x + y * 3) % 7 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(8, 6, 2, 2);
    ctx.fillRect(22, 18, 2, 2);
    return canvas;
  }

  private createWoodFloorTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, 0, 32, 32);

    for (let i = 0; i < 4; i++) {
      const y = i * 8;
      ctx.fillStyle = i % 2 === 0 ? '#a16207' : '#713f12';
      ctx.fillRect(0, y, 32, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, y + 7, 32, 1);

      ctx.fillStyle = '#292524';
      ctx.fillRect(3, y + 3, 2, 1);
      ctx.fillRect(27, y + 3, 2, 1);
    }
    return canvas;
  }

  private createMarshTexture(): HTMLCanvasElement {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#3f4f24';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = '#283618';
    ctx.fillRect(2, 6, 12, 8);
    ctx.fillRect(18, 16, 10, 10);
    ctx.fillStyle = '#606c38';
    ctx.fillRect(6, 8, 4, 3);
    ctx.fillRect(22, 20, 4, 3);
    return canvas;
  }

  private createOakTreeTexture(): HTMLCanvasElement {
    const w = 96,
      h = 128;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    // Trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(40, 75, 16, 48);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(43, 75, 10, 46);

    // Roots
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(36, 123);
    ctx.lineTo(43, 110);
    ctx.lineTo(53, 110);
    ctx.lineTo(60, 123);
    ctx.fill();

    const drawCanopyCircle = (
      cx: number,
      cy: number,
      r: number,
      fill: string,
      stroke?: string
    ) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    drawCanopyCircle(48, 55, 42, '#14532d', '#052e16');
    drawCanopyCircle(32, 60, 26, '#15803d');
    drawCanopyCircle(64, 60, 26, '#15803d');
    drawCanopyCircle(48, 38, 30, '#16a34a');

    drawCanopyCircle(34, 46, 22, '#22c55e');
    drawCanopyCircle(62, 46, 22, '#22c55e');
    drawCanopyCircle(48, 30, 22, '#4ade80');

    drawCanopyCircle(42, 24, 14, '#86efac');
    drawCanopyCircle(58, 26, 12, '#86efac');

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(28, 48, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(68, 54, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(52, 42, 3, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createPineTreeTexture(): HTMLCanvasElement {
    const w = 64,
      h = 140;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#451a03';
    ctx.fillRect(28, 90, 8, 45);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(30, 90, 4, 43);

    const drawPineLayer = (
      y: number,
      baseW: number,
      height: number,
      darkColor: string,
      lightColor: string
    ) => {
      ctx.beginPath();
      ctx.moveTo(32, y - height);
      ctx.lineTo(32 - baseW / 2, y);
      ctx.lineTo(32 + baseW / 2, y);
      ctx.closePath();
      ctx.fillStyle = darkColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(32, y - height);
      ctx.lineTo(32 - baseW / 2, y);
      ctx.lineTo(32, y);
      ctx.closePath();
      ctx.fillStyle = lightColor;
      ctx.fill();
    };

    drawPineLayer(100, 56, 38, '#064e3b', '#047857');
    drawPineLayer(76, 48, 34, '#047857', '#059669');
    drawPineLayer(54, 40, 30, '#059669', '#10b981');
    drawPineLayer(32, 28, 24, '#10b981', '#34d399');
    drawPineLayer(14, 16, 14, '#34d399', '#6ee7b7');

    return canvas;
  }

  private createDeadTreeTexture(): HTMLCanvasElement {
    const w = 80,
      h = 110;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.strokeStyle = '#3f3f46';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#27272a';

    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(40, 105);
    ctx.lineTo(40, 55);
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, 65);
    ctx.lineTo(18, 40);
    ctx.lineTo(10, 20);
    ctx.moveTo(40, 55);
    ctx.lineTo(62, 35);
    ctx.lineTo(70, 15);
    ctx.moveTo(40, 45);
    ctx.lineTo(38, 15);
    ctx.lineTo(30, 8);
    ctx.stroke();

    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 100);
    ctx.lineTo(38, 55);
    ctx.lineTo(16, 38);
    ctx.stroke();

    return canvas;
  }

  private createLargeRockTexture(): HTMLCanvasElement {
    const w = 64,
      h = 56;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(32, 48, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(8, 44);
    ctx.lineTo(4, 28);
    ctx.lineTo(16, 12);
    ctx.lineTo(42, 8);
    ctx.lineTo(58, 22);
    ctx.lineTo(60, 42);
    ctx.lineTo(48, 50);
    ctx.lineTo(18, 50);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(42, 8);
    ctx.lineTo(32, 28);
    ctx.lineTo(12, 30);
    ctx.closePath();
    ctx.fillStyle = '#64748b';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.lineTo(32, 28);
    ctx.lineTo(24, 46);
    ctx.lineTo(8, 44);
    ctx.lineTo(4, 28);
    ctx.closePath();
    ctx.fillStyle = '#475569';
    ctx.fill();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 12);
    ctx.lineTo(40, 9);
    ctx.stroke();

    ctx.fillStyle = '#16a34a';
    ctx.fillRect(10, 36, 6, 4);
    ctx.fillRect(12, 32, 4, 4);

    return canvas;
  }

  private createSmallRockTexture(): HTMLCanvasElement {
    const w = 36,
      h = 28;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(4, 22);
    ctx.lineTo(8, 10);
    ctx.lineTo(24, 6);
    ctx.lineTo(32, 16);
    ctx.lineTo(30, 24);
    ctx.lineTo(12, 26);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(24, 6);
    ctx.lineTo(18, 16);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  private createHouseTexture(): HTMLCanvasElement {
    const w = 160,
      h = 160;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(8, 140, 144, 16);

    // Main House Walls
    ctx.fillStyle = '#d97706';
    ctx.fillRect(16, 75, 128, 75);

    // Stone foundation
    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, 134, 132, 18);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 134, 132, 18);

    // Wood wall timber frames
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 75, 128, 60);
    ctx.beginPath();
    ctx.moveTo(80, 75);
    ctx.lineTo(80, 135);
    ctx.moveTo(16, 75);
    ctx.lineTo(80, 135);
    ctx.moveTo(144, 75);
    ctx.lineTo(80, 135);
    ctx.stroke();

    // Chimney
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(115, 20, 22, 50);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(112, 16, 28, 6);

    // Smoke
    ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
    ctx.beginPath();
    ctx.arc(126, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(130, -2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Roof
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(80, 18);
    ctx.lineTo(4, 78);
    ctx.lineTo(156, 78);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    for (let r = 32; r < 75; r += 10) {
      ctx.beginPath();
      const leftX = 80 - ((r - 18) / 60) * 72;
      const rightX = 80 + ((r - 18) / 60) * 72;
      ctx.moveTo(leftX, r);
      ctx.lineTo(rightX, r);
      ctx.stroke();
    }

    // Door
    ctx.fillStyle = '#451a03';
    ctx.fillRect(66, 100, 28, 48);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(66, 100, 28, 48);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(72, 126, 3, 0, Math.PI * 2);
    ctx.fill();

    // Windows
    const drawWindow = (wx: number, wy: number) => {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(wx, wy, 24, 24);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, 24, 24);
      ctx.beginPath();
      ctx.moveTo(wx + 12, wy);
      ctx.lineTo(wx + 12, wy + 24);
      ctx.moveTo(wx, wy + 12);
      ctx.lineTo(wx + 24, wy + 12);
      ctx.stroke();
    };

    drawWindow(28, 92);
    drawWindow(108, 92);

    return canvas;
  }

  private createBushTexture(): HTMLCanvasElement {
    const w = 48,
      h = 40;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(24, 34, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawCluster = (cx: number, cy: number, r: number, color: string) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    };

    drawCluster(16, 22, 12, '#15803d');
    drawCluster(32, 22, 12, '#15803d');
    drawCluster(24, 14, 12, '#16a34a');
    drawCluster(24, 12, 8, '#4ade80');

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(14, 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(30, 18, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(22, 24, 2.5, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createChestTexture(): HTMLCanvasElement {
    const w = 36,
      h = 32;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(4, 26, 28, 5);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 12, 28, 16);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 12, 28, 16);

    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(18, 14, 14, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(8, 6, 4, 22);
    ctx.fillRect(24, 6, 4, 22);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(15, 14, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(17, 16, 2, 2);

    return canvas;
  }

  private createLampPostTexture(): HTMLCanvasElement {
    const w = 32,
      h = 96;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 84, 12, 8);
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 24, 4, 62);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 20, 16, 4);
    ctx.fillRect(10, 12, 12, 4);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(11, 16, 10, 10);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(13, 18, 6, 6);

    const grad = ctx.createRadialGradient(16, 21, 2, 16, 21, 14);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 21, 14, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createBarrelTexture(): HTMLCanvasElement {
    const w = 32,
      h = 40;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(16, 35, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(16, 20, 12, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.fillRect(4, 10, 24, 3);
    ctx.fillRect(4, 26, 24, 3);

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(16, 7, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  private createFenceTexture(): HTMLCanvasElement {
    const w = 64,
      h = 36;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#78350f';
    ctx.fillRect(6, 6, 6, 26);
    ctx.fillRect(29, 6, 6, 26);
    ctx.fillRect(52, 6, 6, 26);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(2, 12, 60, 4);
    ctx.fillRect(2, 22, 60, 4);

    return canvas;
  }

  private createKnightTexture(): HTMLCanvasElement {
    const w = 40,
      h = 56;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(20, 52, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(12, 22, 16, 24);

    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 42, 5, 10);
    ctx.fillRect(21, 42, 5, 10);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, 20, 14, 22);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(15, 22, 10, 16);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, 8, 12, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(16, 9, 8, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 14, 10, 2);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 3, 4, 6);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(6, 20);
    ctx.lineTo(14, 20);
    ctx.lineTo(14, 34);
    ctx.lineTo(10, 40);
    ctx.lineTo(6, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(9, 24, 2, 10);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(28, 14, 3, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(26, 34, 7, 3);

    return canvas;
  }

  private createPlayerTexture(): HTMLCanvasElement {
    const w = 40,
      h = 54;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(20, 50, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.fillRect(14, 42, 4, 8);
    ctx.fillRect(22, 42, 4, 8);

    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 32, 12, 12);

    ctx.fillStyle = '#059669';
    ctx.fillRect(13, 18, 14, 16);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(15, 20, 10, 12);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(13, 30, 14, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(18, 29, 4, 5);

    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(15, 8, 10, 10);

    ctx.fillStyle = '#b45309';
    ctx.fillRect(14, 5, 12, 6);
    ctx.fillRect(13, 8, 3, 6);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(17, 12, 2, 2);
    ctx.fillRect(21, 12, 2, 2);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(28, 22, 10, Math.PI * 0.8, Math.PI * 1.6);
    ctx.stroke();

    return canvas;
  }
}
