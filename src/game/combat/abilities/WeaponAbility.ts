import type { Weapon } from '../Weapon';

// Strategy interface for weapon fire behaviors.
// Add new abilities (MeleeSwing, Projectile, etc.) by implementing this.
export abstract class WeaponAbility {
  abstract fire(
    scene: Phaser.Scene,
    weapon: Weapon,
    slot: unknown, // WeaponSlot — typed via concrete subclasses to avoid circular import
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
  ): void;
}
