/**
 * src/core/IdGenerator.ts
 * Generates unique, stable, and deterministic IDs for map entities and objects.
 */

let counter = 0;

export class IdGenerator {
  /**
   * Generates a unique string ID with a prefix.
   */
  static generate(prefix = 'obj'): string {
    counter = (counter + 1) % 1000000;
    const time = Date.now().toString(36);
    const count = counter.toString(36).padStart(4, '0');
    const random = Math.floor(Math.random() * 0xffffff).toString(36).padStart(4, '0');
    return `${prefix}_${time}_${count}_${random}`;
  }
}
