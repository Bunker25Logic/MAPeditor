/**
 * src/core/Transform.ts
 * Centralized transform representation and geometric calculations.
 */

export interface TransformData {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // In radians
  anchorX: number;
  anchorY: number;
}

export class Transform {
  /**
   * Transforms a world coordinate into object local coordinate space
   */
  static worldToLocal(
    wx: number,
    wy: number,
    transform: TransformData
  ): { localX: number; localY: number } {
    const scaleX = transform.scaleX !== 0 ? transform.scaleX : 1;
    const scaleY = transform.scaleY !== 0 ? transform.scaleY : 1;
    const rot = transform.rotation || 0;

    // 1. Translate to origin
    const dx = wx - transform.x;
    const dy = wy - transform.y;

    // 2. Rotate by negative angle
    const cos = Math.cos(-rot);
    const sin = Math.sin(-rot);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    // 3. Unscale
    const localX = rx / scaleX;
    const localY = ry / scaleY;

    return { localX, localY };
  }

  /**
   * Tests if a world point hits a bounding box defined by width, height and anchor.
   */
  static hitTest(
    wx: number,
    wy: number,
    width: number,
    height: number,
    transform: TransformData
  ): boolean {
    if (width <= 0 || height <= 0) return false;

    const { localX, localY } = this.worldToLocal(wx, wy, transform);

    const minX = -width * transform.anchorX;
    const maxX = minX + width;
    const minY = -height * transform.anchorY;
    const maxY = minY + height;

    return localX >= minX && localX <= maxX && localY >= minY && localY <= maxY;
  }
}
