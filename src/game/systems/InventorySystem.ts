import type { Weapon } from '../combat/Weapon';

export class InventorySystem {
  private readonly MAX_SIZE = 12;
  private weapons: (Weapon | null)[];

  constructor() {
    this.weapons = new Array(this.MAX_SIZE).fill(null);
  }

  /** Adds a weapon to the first available slot. Returns false if inventory is full. */
  addWeapon(weapon: Weapon): boolean {
    const idx = this.weapons.indexOf(null);
    if (idx === -1) return false;
    this.weapons[idx] = weapon;
    return true;
  }

  /** Removes and returns the weapon at the given index. Returns null if slot was empty. */
  removeAt(index: number): Weapon | null {
    const w = this.weapons[index] ?? null;
    this.weapons[index] = null;
    return w;
  }

  /** Returns a shallow copy of the weapon array (null = empty slot). */
  getAll(): (Weapon | null)[] {
    return [...this.weapons];
  }

  /** Number of weapons currently in inventory. */
  getCount(): number {
    return this.weapons.filter((w) => w !== null).length;
  }

  isFull(): boolean {
    return !this.weapons.includes(null);
  }

  isEmpty(): boolean {
    return this.weapons.every((w) => w === null);
  }

  readonly maxSize = 12;
}
