/**
 * src/rendering/Camera.ts
 * Pure 2D Camera mathematics for panning, zooming, and viewport bounds.
 */

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Camera {
  public x = 0;
  public y = 0;
  public zoom = 1.0;
  public minZoom = 0.1;
  public maxZoom = 5.0;

  public viewportWidth = 800;
  public viewportHeight = 600;

  public isDragging = false;
  public dragStartX = 0;
  public dragStartY = 0;
  public startCamX = 0;
  public startCamY = 0;

  private onChange?: () => void;

  constructor(onChange?: () => void) {
    this.onChange = onChange;
  }

  setViewportSize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
    this.notify();
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.notify();
  }

  setZoom(zoom: number, focusScreenX?: number, focusScreenY?: number): void {
    const nextZoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    if (nextZoom === this.zoom) return;

    const screenX = focusScreenX !== undefined ? focusScreenX : this.viewportWidth / 2;
    const screenY = focusScreenY !== undefined ? focusScreenY : this.viewportHeight / 2;

    // World coordinates under focus point before zoom
    const wx = (screenX - this.x) / this.zoom;
    const wy = (screenY - this.y) / this.zoom;

    this.zoom = nextZoom;

    // Re-adjust camera position so wx, wy stays under screenX, screenY
    this.x = screenX - wx * this.zoom;
    this.y = screenY - wy * this.zoom;

    this.notify();
  }

  zoomBy(factor: number, focusScreenX?: number, focusScreenY?: number): void {
    this.setZoom(this.zoom * factor, focusScreenX, focusScreenY);
  }

  screenToWorld(screenX: number, screenY: number): { wx: number; wy: number } {
    return {
      wx: (screenX - this.x) / this.zoom,
      wy: (screenY - this.y) / this.zoom
    };
  }

  worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: wx * this.zoom + this.x,
      sy: wy * this.zoom + this.y
    };
  }

  getViewportBounds(padding = 0): ViewportBounds {
    const topLeft = this.screenToWorld(-padding, -padding);
    const bottomRight = this.screenToWorld(this.viewportWidth + padding, this.viewportHeight + padding);

    return {
      minX: Math.min(topLeft.wx, bottomRight.wx),
      minY: Math.min(topLeft.wy, bottomRight.wy),
      maxX: Math.max(topLeft.wx, bottomRight.wx),
      maxY: Math.max(topLeft.wy, bottomRight.wy)
    };
  }

  centerOnWorld(wx: number, wy: number): void {
    this.x = this.viewportWidth / 2 - wx * this.zoom;
    this.y = this.viewportHeight / 2 - wy * this.zoom;
    this.notify();
  }

  private notify(): void {
    if (this.onChange) this.onChange();
  }
}
