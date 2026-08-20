/**
 * History.js
 * Undo / Redo Command Pattern manager for all map modifications.
 */

export class History {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
    this.onChanged = null;
  }

  push(action) {
    this.undoStack.push(action);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    // Clear redo stack on new action
    this.redoStack = [];
    this.notify();
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  undo(editor) {
    if (!this.canUndo()) return false;
    const action = this.undoStack.pop();
    this.redoStack.push(action);

    this.applyAction(action, true, editor);
    this.notify();
    return true;
  }

  redo(editor) {
    if (!this.canRedo()) return false;
    const action = this.redoStack.pop();
    this.undoStack.push(action);

    this.applyAction(action, false, editor);
    this.notify();
    return true;
  }

  applyAction(action, isUndo, editor) {
    switch (action.type) {
      case 'TILES_PAINT': {
        // action.tiles: array of { x, y, prev, next }
        for (const tile of action.tiles) {
          const target = isUndo ? tile.prev : tile.next;
          editor.map.setTile(tile.x, tile.y, target);
          editor.terrainLayer.updateTile(tile.x, tile.y, target);
        }
        break;
      }

      case 'OBJECT_ADD': {
        if (isUndo) {
          editor.map.removeObject(action.object.id);
          editor.objectLayer.removeObject(action.object.id);
        } else {
          editor.map.addObject(action.object);
          editor.objectLayer.addObject(action.object);
        }
        break;
      }

      case 'OBJECT_REMOVE': {
        if (isUndo) {
          editor.map.addObject(action.object);
          editor.objectLayer.addObject(action.object);
        } else {
          editor.map.removeObject(action.object.id);
          editor.objectLayer.removeObject(action.object.id);
        }
        break;
      }

      case 'OBJECTS_BATCH_ADD': {
        if (isUndo) {
          for (const obj of action.objects) {
            editor.map.removeObject(obj.id);
            editor.objectLayer.removeObject(obj.id);
          }
        } else {
          for (const obj of action.objects) {
            editor.map.addObject(obj);
            editor.objectLayer.addObject(obj);
          }
        }
        break;
      }

      case 'OBJECT_TRANSFORM': {
        const state = isUndo ? action.oldState : action.newState;
        const obj = editor.map.getObject(state.id);
        if (obj) {
          Object.assign(obj, state);
          editor.objectLayer.updateObjectTransform(obj);
          if (editor.objectManager.selectedObjectId === obj.id) {
            editor.ui.updateInspector(obj);
          }
        }
        break;
      }

      case 'MAP_RESTORE': {
        const targetMap = isUndo ? action.oldMap : action.newMap;
        editor.loadMapData(targetMap);
        break;
      }
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  notify() {
    if (this.onChanged) {
      this.onChanged({
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    }
  }
}
