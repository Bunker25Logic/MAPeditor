/**
 * DepthSorter.js
 * Implements automated Y-axis depth sorting for 2D MMO RPG layers.
 * 
 * Concept:
 * In a top-down / 2.5D RPG perspective, an entity whose ground touchpoint (y)
 * is lower down the screen (larger Y) is closer to the camera/viewer, and must
 * render IN FRONT OF entities higher up (smaller Y).
 * 
 * Example:
 * If Tree.y = 300 and Player.y = 280 -> Player is behind Tree.
 * If Player moves to Player.y = 320 -> Player is in front of Tree.
 */

export class DepthSorter {
  constructor(objectContainer) {
    this.container = objectContainer;
    // Enable PixiJS zIndex sorting on the container
    this.container.sortableChildren = true;
  }

  /**
   * Updates depth sorting for all objects in the container
   */
  updateDepthSorting() {
    for (let i = 0; i < this.container.children.length; i++) {
      const child = this.container.children[i];
      // The child's position.y represents its ground anchor coordinate
      if (child.objectData) {
        child.zIndex = Math.floor(child.position.y);
      }
    }
    // Force PixiJS container to re-sort children by zIndex
    this.container.sortChildren();
  }

  /**
   * Sorts a single entity immediately
   */
  sortEntity(child) {
    if (child && child.objectData) {
      child.zIndex = Math.floor(child.position.y);
    }
    this.container.sortChildren();
  }
}
