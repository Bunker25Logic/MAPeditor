/**
 * AssetManager.js
 * Manages procedural pixel art textures, spritesheets, and custom uploaded assets for PixiJS.
 * Prepared for future Texture Atlas / Spritesheet integration.
 */

import * as PIXI from 'pixi.js';

export class AssetManager {
  constructor() {
    this.terrains = new Map();
    this.objects = new Map();
    this.customAssets = new Map();
    this.initialized = false;
  }

  /**
   * Initializes built-in procedural assets so the editor works immediately without external files
   */
  async init() {
    if (this.initialized) return;

    // Generate procedural terrain tiles (32x32)
    this.registerTerrain('grass', 'Grama', this.createGrassTexture());
    this.registerTerrain('dirt', 'Terra', this.createDirtTexture());
    this.registerTerrain('sand', 'Areia', this.createSandTexture());
    this.registerTerrain('stone', 'Pedra / Pavimento', this.createStoneTexture());
    this.registerTerrain('water', 'Água', this.createWaterTexture());
    this.registerTerrain('snow', 'Neve', this.createSnowTexture());
    this.registerTerrain('wood_floor', 'Madeira / Piso', this.createWoodFloorTexture());
    this.registerTerrain('marsh', 'Pântano', this.createMarshTexture());

    // Generate procedural objects (multi-tile sprites with anchors & hitboxes)
    this.registerObject('tree_oak', {
      name: 'Árvore Carvalho',
      category: 'Natureza',
      width: 96,
      height: 128,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 26, height: 18, offsetX: 0, offsetY: -9 },
      texture: this.createOakTreeTexture()
    });

    this.registerObject('tree_pine', {
      name: 'Pinheiro',
      category: 'Natureza',
      width: 64,
      height: 140,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 22, height: 16, offsetX: 0, offsetY: -8 },
      texture: this.createPineTreeTexture()
    });

    this.registerObject('tree_dead', {
      name: 'Árvore Seca',
      category: 'Natureza',
      width: 80,
      height: 110,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 22, height: 16, offsetX: 0, offsetY: -8 },
      texture: this.createDeadTreeTexture()
    });

    this.registerObject('rock_large', {
      name: 'Pedra Grande',
      category: 'Natureza',
      width: 64,
      height: 56,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 50, height: 28, offsetX: 0, offsetY: -14 },
      texture: this.createLargeRockTexture()
    });

    this.registerObject('rock_small', {
      name: 'Pedra Pequena',
      category: 'Natureza',
      width: 36,
      height: 28,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 28, height: 18, offsetX: 0, offsetY: -9 },
      texture: this.createSmallRockTexture()
    });

    this.registerObject('house_wood', {
      name: 'Casa Medieval',
      category: 'Construções',
      width: 160,
      height: 160,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 140, height: 75, offsetX: 0, offsetY: -38 },
      texture: this.createHouseTexture()
    });

    this.registerObject('bush', {
      name: 'Arbusto com Frutos',
      category: 'Natureza',
      width: 48,
      height: 40,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 38, height: 24, offsetX: 0, offsetY: -12 },
      texture: this.createBushTexture()
    });

    this.registerObject('chest', {
      name: 'Baú do Tesouro',
      category: 'Itens',
      width: 36,
      height: 32,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 30, height: 22, offsetX: 0, offsetY: -11 },
      texture: this.createChestTexture()
    });

    this.registerObject('lamp_post', {
      name: 'Poste de Luz',
      category: 'Decoração',
      width: 32,
      height: 96,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 16, height: 12, offsetX: 0, offsetY: -6 },
      texture: this.createLampPostTexture()
    });

    this.registerObject('barrel', {
      name: 'Barril de Madeira',
      category: 'Decoração',
      width: 32,
      height: 40,
      anchorX: 0.5,
      anchorY: 0.85,
      collision: true,
      collisionBox: { width: 26, height: 22, offsetX: 0, offsetY: -11 },
      texture: this.createBarrelTexture()
    });

    this.registerObject('fence_wood', {
      name: 'Cerca de Madeira',
      category: 'Construções',
      width: 64,
      height: 36,
      anchorX: 0.5,
      anchorY: 0.9,
      collision: true,
      collisionBox: { width: 60, height: 14, offsetX: 0, offsetY: -7 },
      texture: this.createFenceTexture()
    });

    this.registerObject('npc_knight', {
      name: 'Guarda / Cavaleiro NPC',
      category: 'NPCs',
      width: 40,
      height: 56,
      anchorX: 0.5,
      anchorY: 0.95,
      collision: true,
      collisionBox: { width: 24, height: 16, offsetX: 0, offsetY: -8 },
      texture: this.createKnightTexture()
    });

    // Special avatar for interactive walk test
    this.playerTexture = this.createPlayerTexture();

    this.initialized = true;
  }

  registerTerrain(id, name, canvas) {
    const texture = PIXI.Texture.from(canvas);
    this.terrains.set(id, {
      id,
      name,
      tileWidth: 32,
      tileHeight: 32,
      canvas,
      texture
    });
  }

  registerObject(id, data) {
    const texture = PIXI.Texture.from(data.texture);
    this.objects.set(id, {
      id,
      name: data.name || id,
      category: data.category || 'Geral',
      width: data.width,
      height: data.height,
      anchorX: data.anchorX !== undefined ? data.anchorX : 0.5,
      anchorY: data.anchorY !== undefined ? data.anchorY : 1.0,
      collision: data.collision !== undefined ? data.collision : true,
      collisionBox: data.collisionBox || { width: data.width * 0.6, height: 20, offsetX: 0, offsetY: -10 },
      canvas: data.texture,
      texture
    });
  }

  getTerrain(id) {
    return this.terrains.get(id) || this.terrains.get('grass');
  }

  getObjectDef(id) {
    return this.objects.get(id);
  }

  getAllTerrains() {
    return Array.from(this.terrains.values());
  }

  getAllObjects() {
    return Array.from(this.objects.values());
  }

  /**
   * Imports a user-provided image file from disk and registers as Terrain or Object
   */
  async loadCustomImage(file, type = 'object', name = '') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const id = 'custom_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          const assetName = name || file.name.replace(/\.[^/.]+$/, '');
          
          if (type === 'terrain') {
            // Scale or draw to 32x32 canvas for terrain tile
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, 32, 32);
            this.registerTerrain(id, assetName, canvas);
            resolve({ type: 'terrain', id, name: assetName });
          } else {
            // Free object sprite
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            this.registerObject(id, {
              name: assetName,
              category: 'Importados',
              width: img.width,
              height: img.height,
              anchorX: 0.5,
              anchorY: 0.95,
              collision: true,
              collisionBox: { width: Math.max(16, img.width * 0.5), height: 20, offsetX: 0, offsetY: -10 },
              texture: canvas
            });
            resolve({ type: 'object', id, name: assetName });
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* =========================================================================
     PROCEDURAL TEXTURE BUILDERS (High quality RPG pixel art canvases)
     ========================================================================= */

  createCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }

  createGrassTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 32, 32);

    // Base shades
    ctx.fillStyle = '#3eb96b';
    ctx.fillRect(0, 0, 32, 16);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 16, 32, 16);

    // Grass blades pattern
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
    // Subtle border pattern for tile cohesion
    ctx.fillStyle = 'rgba(21, 128, 61, 0.15)';
    ctx.strokeRect(0.5, 0.5, 31, 31);
    return canvas;
  }

  createDirtTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, 32, 32);

    const dirtColors = ['#78350f', '#b45309', '#d97706', '#5c2b09', '#a16207'];
    for (let x = 0; x < 32; x += 3) {
      for (let y = 0; y < 32; y += 3) {
        const c = dirtColors[(x * 11 + y * 17) % dirtColors.length];
        ctx.fillStyle = c;
        ctx.fillRect(x + (y % 2), y, 2, 2);
        // Small pebble
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

  createSandTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
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

  createStoneTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 32, 32);

    // Cobblestone bricks pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    // Row 1
    ctx.fillStyle = '#64748b';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillRect(17, 1, 14, 14);
    // Row 2 (offset)
    ctx.fillStyle = '#525e75';
    ctx.fillRect(1, 17, 7, 14);
    ctx.fillRect(10, 17, 14, 14);
    ctx.fillRect(26, 17, 5, 14);

    // Mortar lines
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.strokeRect(16.5, 0.5, 15, 15);
    ctx.strokeRect(0.5, 16.5, 8.5, 15);
    ctx.strokeRect(9.5, 16.5, 15, 15);
    ctx.strokeRect(25.5, 16.5, 6, 15);
    return canvas;
  }

  createWaterTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, 32, 32);

    // Deep water wave patterns
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 8, 32, 4);
    ctx.fillRect(0, 22, 32, 4);

    // Water glints
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

  createSnowTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
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
    // Blue ice glint
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(8, 6, 2, 2);
    ctx.fillRect(22, 18, 2, 2);
    return canvas;
  }

  createWoodFloorTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#854d0e';
    ctx.fillRect(0, 0, 32, 32);

    // 4 horizontal wood planks
    for (let i = 0; i < 4; i++) {
      const y = i * 8;
      ctx.fillStyle = i % 2 === 0 ? '#a16207' : '#713f12';
      ctx.fillRect(0, y, 32, 7);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, y + 7, 32, 1); // seam

      // Wood grain & nails
      ctx.fillStyle = '#292524';
      ctx.fillRect(3, y + 3, 2, 1);
      ctx.fillRect(27, y + 3, 2, 1);
    }
    return canvas;
  }

  createMarshTexture() {
    const canvas = this.createCanvas(32, 32);
    const ctx = canvas.getContext('2d');
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

  createOakTreeTexture() {
    const w = 96, h = 128;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

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

    // Foliage layers (Large rounded lush canopy)
    const drawCanopyCircle = (cx, cy, r, fill, stroke) => {
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

    // Dark base shadow
    drawCanopyCircle(48, 55, 42, '#14532d', '#052e16');
    drawCanopyCircle(32, 60, 26, '#15803d');
    drawCanopyCircle(64, 60, 26, '#15803d');
    drawCanopyCircle(48, 38, 30, '#16a34a');

    // Midtone clusters
    drawCanopyCircle(34, 46, 22, '#22c55e');
    drawCanopyCircle(62, 46, 22, '#22c55e');
    drawCanopyCircle(48, 30, 22, '#4ade80');

    // Top highlights
    drawCanopyCircle(42, 24, 14, '#86efac');
    drawCanopyCircle(58, 26, 12, '#86efac');

    // Subtle apple/flower accents
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(28, 48, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(68, 54, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(52, 42, 3, 0, Math.PI*2); ctx.fill();

    return canvas;
  }

  createPineTreeTexture() {
    const w = 64, h = 140;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(28, 90, 8, 45);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(30, 90, 4, 43);

    // Layered Pine Cones / Triangles
    const drawPineLayer = (y, baseW, height, darkColor, lightColor) => {
      ctx.beginPath();
      ctx.moveTo(32, y - height);
      ctx.lineTo(32 - baseW / 2, y);
      ctx.lineTo(32 + baseW / 2, y);
      ctx.closePath();
      ctx.fillStyle = darkColor;
      ctx.fill();

      // Highlight left side
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

  createDeadTreeTexture() {
    const w = 80, h = 110;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = '#3f3f46';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#27272a';

    // Trunk
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(40, 105);
    ctx.lineTo(40, 55);
    ctx.stroke();

    // Major branches
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

    // Spooky highlight
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, 100);
    ctx.lineTo(38, 55);
    ctx.lineTo(16, 38);
    ctx.stroke();

    return canvas;
  }

  createLargeRockTexture() {
    const w = 64, h = 56;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Rock base shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(32, 48, 28, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boulder body
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

    // Facet highlights
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

    // Top bright glint & moss
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 12);
    ctx.lineTo(40, 9);
    ctx.stroke();

    // Green moss on side
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(10, 36, 6, 4);
    ctx.fillRect(12, 32, 4, 4);

    return canvas;
  }

  createSmallRockTexture() {
    const w = 36, h = 28;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

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

  createHouseTexture() {
    const w = 160, h = 160;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Ground shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(8, 140, 144, 16);

    // Main House Walls (Wood / Stone base)
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
    ctx.moveTo(80, 75); ctx.lineTo(80, 135);
    ctx.moveTo(16, 75); ctx.lineTo(80, 135);
    ctx.moveTo(144, 75); ctx.lineTo(80, 135);
    ctx.stroke();

    // Chimney
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(115, 20, 22, 50);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(112, 16, 28, 6);
    // Smoke
    ctx.fillStyle = 'rgba(241, 245, 249, 0.6)';
    ctx.beginPath(); ctx.arc(126, 8, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(130, -2, 8, 0, Math.PI*2); ctx.fill();

    // Roof (Tiled gable roof)
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

    // Roof tiles lines
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
    // Golden door knob
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(72, 126, 3, 0, Math.PI*2); ctx.fill();

    // Windows (Glowing warm light)
    const drawWindow = (wx, wy) => {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(wx, wy, 24, 24);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 3;
      ctx.strokeRect(wx, wy, 24, 24);
      ctx.beginPath();
      ctx.moveTo(wx + 12, wy); ctx.lineTo(wx + 12, wy + 24);
      ctx.moveTo(wx, wy + 12); ctx.lineTo(wx + 24, wy + 12);
      ctx.stroke();
    };

    drawWindow(28, 92);
    drawWindow(108, 92);

    return canvas;
  }

  createBushTexture() {
    const w = 48, h = 40;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Base shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(24, 34, 18, 5, 0, 0, Math.PI*2); ctx.fill();

    // Leafy balls
    const drawCluster = (cx, cy, r, color) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill();
    };

    drawCluster(16, 22, 12, '#15803d');
    drawCluster(32, 22, 12, '#15803d');
    drawCluster(24, 14, 12, '#16a34a');
    drawCluster(24, 12, 8, '#4ade80');

    // Red berries
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(14, 16, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(30, 18, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, 24, 2.5, 0, Math.PI*2); ctx.fill();

    return canvas;
  }

  createChestTexture() {
    const w = 36, h = 32;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(4, 26, 28, 5);

    // Box body
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 12, 28, 16);
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 12, 28, 16);

    // Lid arc
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(18, 14, 14, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    // Gold band reinforcements
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(8, 6, 4, 22);
    ctx.fillRect(24, 6, 4, 22);

    // Golden lock
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(15, 14, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(17, 16, 2, 2);

    return canvas;
  }

  createLampPostTexture() {
    const w = 32, h = 96;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(10, 84, 12, 8);
    // Pole
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 24, 4, 62);
    // Lantern mount
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(8, 20, 16, 4);
    ctx.fillRect(10, 12, 12, 4);

    // Glowing lantern glass
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(11, 16, 10, 10);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(13, 18, 6, 6);

    // Warm light halo
    const grad = ctx.createRadialGradient(16, 21, 2, 16, 21, 14);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(16, 21, 14, 0, Math.PI*2); ctx.fill();

    return canvas;
  }

  createBarrelTexture() {
    const w = 32, h = 40;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(16, 35, 12, 4, 0, 0, Math.PI*2); ctx.fill();

    // Wood body
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(16, 20, 12, 15, 0, 0, Math.PI*2);
    ctx.fill();

    // Iron bands
    ctx.fillStyle = '#475569';
    ctx.fillRect(4, 10, 24, 3);
    ctx.fillRect(4, 26, 24, 3);

    // Top rim
    ctx.fillStyle = '#78350f';
    ctx.beginPath(); ctx.ellipse(16, 7, 10, 3, 0, 0, Math.PI*2); ctx.fill();

    return canvas;
  }

  createFenceTexture() {
    const w = 64, h = 36;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#78350f';
    // 3 Vertical posts
    ctx.fillRect(6, 6, 6, 26);
    ctx.fillRect(29, 6, 6, 26);
    ctx.fillRect(52, 6, 6, 26);

    // Horizontal rails
    ctx.fillStyle = '#92400e';
    ctx.fillRect(2, 12, 60, 4);
    ctx.fillRect(2, 22, 60, 4);

    return canvas;
  }

  createKnightTexture() {
    const w = 40, h = 56;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(20, 52, 14, 4, 0, 0, Math.PI*2); ctx.fill();

    // Red Cape
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(12, 22, 16, 24);

    // Legs / Boots
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 42, 5, 10);
    ctx.fillRect(21, 42, 5, 10);

    // Armor Body
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(13, 20, 14, 22);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(15, 22, 10, 16);

    // Helmet
    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, 8, 12, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(16, 9, 8, 8);
    // Helmet Visor Slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 14, 10, 2);
    // Plume
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 3, 4, 6);

    // Shield (Left)
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.moveTo(6, 20); ctx.lineTo(14, 20); ctx.lineTo(14, 34); ctx.lineTo(10, 40); ctx.lineTo(6, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(9, 24, 2, 10);

    // Sword (Right)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(28, 14, 3, 28);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(26, 34, 7, 3);

    return canvas;
  }

  createPlayerTexture() {
    const w = 40, h = 54;
    const canvas = this.createCanvas(w, h);
    const ctx = canvas.getContext('2d');

    // Hero Character Sprite with Green Cloak & Leather Gear
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(20, 50, 12, 4, 0, 0, Math.PI*2); ctx.fill();

    // Boots
    ctx.fillStyle = '#78350f';
    ctx.fillRect(14, 42, 4, 8);
    ctx.fillRect(22, 42, 4, 8);

    // Trousers
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 32, 12, 12);

    // Tunic / Vest
    ctx.fillStyle = '#059669';
    ctx.fillRect(13, 18, 14, 16);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(15, 20, 10, 12);

    // Belt
    ctx.fillStyle = '#451a03';
    ctx.fillRect(13, 30, 14, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(18, 29, 4, 5);

    // Head / Face
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(15, 8, 10, 10);

    // Hair
    ctx.fillStyle = '#b45309';
    ctx.fillRect(14, 5, 12, 6);
    ctx.fillRect(13, 8, 3, 6);

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(17, 12, 2, 2);
    ctx.fillRect(21, 12, 2, 2);

    // Backpack / Bow on back
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(28, 22, 10, Math.PI * 0.8, Math.PI * 1.6);
    ctx.stroke();

    return canvas;
  }
}
