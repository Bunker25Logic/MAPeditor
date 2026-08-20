/**
 * src/rendering/DepthSorter.ts
 * Sorts objects by render category and vertical depth.
 */

import { MapObject, ObjectDefinition } from '../core/types';

export const CATEGORY_ORDER: Record<string, number> = {
  ground: 0,
  terrain: 10,
  entity: 20,
  object: 30,
  roof: 40,
  foreground: 50
};

export class DepthSorter {
  /**
   * Sorts objects array in place or returns sorted copy.
   * Priority:
   * 1. Category layer (ground < terrain < object < roof < foreground)
   * 2. Y coordinate (depth)
   * 3. ID as deterministic tie breaker
   */
  static sortObjects(
    objects: MapObject[],
    getAssetDef: (assetId: string) => ObjectDefinition | null
  ): MapObject[] {
    return [...objects].sort((a, b) => {
      const defA = getAssetDef(a.asset);
      const defB = getAssetDef(b.asset);

      const catA = defA?.renderCategory || 'object';
      const catB = defB?.renderCategory || 'object';

      const orderA = CATEGORY_ORDER[catA] ?? 30;
      const orderB = CATEGORY_ORDER[catB] ?? 30;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Vertical depth sorting
      if (Math.abs(a.y - b.y) > 0.001) {
        return a.y - b.y;
      }

      // Tie breaker: X coordinate, then ID
      if (Math.abs(a.x - b.x) > 0.001) {
        return a.x - b.x;
      }

      return a.id.localeCompare(b.id);
    });
  }
}
