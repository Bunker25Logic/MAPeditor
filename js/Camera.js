/**
 * Camera.js
 * Controls Pan, Zoom, World/Screen Coordinate transformations,
 * and view centering for the PixiJS Stage.
 */

export class Camera {
  constructor(stage, pixiApp, map) {
    this.stage = stage;
    this.app = pixiApp;
    this.map = map;

    this.zoom = 1.0;
    this.minZoom = 0.15;
    this.maxZoom = 4.0;

    this.x = 0; // World offset X
    this.y = 0; // World offset Y

    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.onTransformChanged = null;
  }

  /**
   * Centers the camera on the map center
   */
  centerOnMap() {
    const viewW = this.app.screen.width;
    const viewH = this.app.screen.height;
    const mapW = this.map.getWorldWidth();
    const mapH = this.map.getWorldHeight();

    // Pick a comfortable initial zoom
    const zoomX = (viewW * 0.85) / mapW;
    const zoomY = (viewH * 0.85) / mapH;
    this.zoom = Math.min(1.0, Math.max(0.4, Math.min(zoomX, zoomY)));

    this.x = (viewW - mapW * this.zoom) / 2;
    this.y = (viewH - mapH * this.zoom) / 2;

    this.applyTransform();
  }

  setZoom(newZoom, pivotScreenX, pivotScreenY) {
    const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    if (clamped === this.zoom) return;

    const screenX = pivotScreenX !== undefined ? pivotScreenX : this.app.screen.width / 2;
    const screenY = pivotScreenY !== undefined ? pivotScreenY : this.app.screen.height / 2;

    // Calculate world point before zoom
    const worldBefore = this.screenToWorld(screenX, screenY);

    this.zoom = clamped;

    // Adjust pan so the world point remains under the cursor
    this.x = screenX - worldBefore.wx * this.zoom;
    this.y = screenY - worldBefore.wy * this.zoom;

    this.applyTransform();
  }

  zoomAt(delta, screenX, screenY) {
    const factor = delta > 0 ? 0.9 : 1.1;
    this.setZoom(this.zoom * factor, screenX, screenY);
  }

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.applyTransform();
  }

  applyTransform() {
    this.stage.position.set(Math.round(this.x), Math.round(this.y));
    this.stage.scale.set(this.zoom);

    if (this.onTransformChanged) {
      this.onTransformChanged({
        zoom: this.zoom,
        x: this.x,
        y: this.y,
        viewBounds: this.getViewBounds()
      });
    }
  }

  /**
   * Calculates the current visible world coordinate bounding box
   * with an optional margin to prevent visual pop-in during movement.
   * @param {number} margin Safety buffer in world pixels
   * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
   */
  getViewBounds(margin = 128) {
    const screenW = this.app.screen.width || window.innerWidth;
    const screenH = this.app.screen.height || window.innerHeight;

    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(screenW, screenH);

    const minX = Math.min(topLeft.wx, bottomRight.wx) - margin;
    const minY = Math.min(topLeft.wy, bottomRight.wy) - margin;
    const maxX = Math.max(topLeft.wx, bottomRight.wx) + margin;
    const maxY = Math.max(topLeft.wy, bottomRight.wy) + margin;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Converts viewport/canvas screen pixels to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      wx: (screenX - this.x) / this.zoom,
      wy: (screenY - this.y) / this.zoom
    };
  }

  /**
   * Converts world coordinates to viewport/canvas screen pixels
   */
  worldToScreen(worldX, worldY) {
    return {
      sx: worldX * this.zoom + this.x,
      sy: worldY * this.zoom + this.y
    };
  }
}
