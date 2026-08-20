/**
 * IdGenerator.js
 * Generates unique, stable, serializable IDs for objects and entities.
 */

let counter = 0;

export class IdGenerator {
  /**
   * Generates a unique string ID with a descriptive prefix.
   * @param {string} prefix 
   * @returns {string}
   */
  static generate(prefix = 'obj') {
    counter = (counter + 1) % 1000000;
    const time = Date.now().toString(36);
    const count = counter.toString(36).padStart(4, '0');
    const random = Math.floor(Math.random() * 0xffffff).toString(36).padStart(4, '0');
    return `${prefix}_${time}_${count}_${random}`;
  }
}
