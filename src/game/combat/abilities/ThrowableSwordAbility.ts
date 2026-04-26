import { WeaponAbility } from './WeaponAbility';
import type { Weapon } from '../Weapon';

// Concrete ability type for the throwable/boomerang weapon family.
// WeaponSlot uses this as a type tag to decide which projectile to instantiate.
// Future abilities (MeleeSwing, RangedShot, etc.) would add their own subclasses.
export class ThrowableSwordAbility extends WeaponAbility {
  fire(
    _scene: Phaser.Scene,
    _weapon: Weapon,
    _slot: unknown,
    _originX: number,
    _originY: number,
    _targetX: number,
    _targetY: number,
  ): void {
    // No-op: ThrowableSword firing is fully managed by WeaponSlot.tryFire
    // which directly controls the projectile lifecycle and cooldown state.
  }
}
