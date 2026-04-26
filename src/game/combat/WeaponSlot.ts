import type { Weapon } from './Weapon';
import type { PlayerAttributes, SlotData } from '../types/GameTypes';
import {
  ThrowableSwordProjectile,
  type IWeaponSlotCallback,
} from './projectiles/ThrowableSwordProjectile';

export class WeaponSlot implements IWeaponSlotCallback {
  private weapon: Weapon | null = null;
  private cooldownRemaining: number = 0;
  private activeProjectile: ThrowableSwordProjectile | null = null;
  readonly slotIndex: 1 | 2;

  constructor(slotIndex: 1 | 2) {
    this.slotIndex = slotIndex;
  }

  equip(weapon: Weapon) {
    this.weapon = weapon;
    this.cooldownRemaining = 0;
    this.activeProjectile = null;
  }

  isReady(): boolean {
    return (
      this.weapon !== null &&
      this.cooldownRemaining <= 0 &&
      this.activeProjectile === null
    );
  }

  /** Empties the slot without affecting the active projectile cooldown. */
  clear() {
    this.weapon = null;
    this.cooldownRemaining = 0;
    // Leave activeProjectile alone — it will return and call onProjectileReturned harmlessly.
  }

  tryFire(
    scene: Phaser.Scene,
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    getOwnerPos: () => { x: number; y: number },
    getOwnerAttributes: () => PlayerAttributes,
    projectileGroup: Phaser.Physics.Arcade.Group,
  ): boolean {
    if (!this.isReady() || !this.weapon) return false;

    const proj = new ThrowableSwordProjectile(scene, originX, originY);
    proj.init(this.weapon, this, getOwnerPos, getOwnerAttributes);
    // add() before launch() — the physics group's createCallbackHandler resets velocity
    // and allowGravity to defaults for every added child; launch() overrides them after.
    projectileGroup.add(proj, true);
    proj.launch(targetX, targetY);
    this.activeProjectile = proj;
    return true;
  }

  // Called by the projectile when it returns to the player.
  onProjectileReturned() {
    this.activeProjectile = null;
    if (this.weapon) {
      this.cooldownRemaining = this.weapon.cooldownMs;
    }
  }

  update(delta: number) {
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - delta);
    }
  }

  getCooldownFraction(): number {
    if (!this.weapon || this.weapon.cooldownMs <= 0) return 0;
    return Math.max(0, Math.min(1, this.cooldownRemaining / this.weapon.cooldownMs));
  }

  getSlotData(): SlotData {
    if (!this.weapon) {
      return {
        weaponName: 'Empty',
        rarity: 'Common',
        rarityColor: 0x555555,
        cooldownFraction: 0,
        equipped: false,
      };
    }
    return {
      weaponName: this.weapon.displayName,
      rarity: this.weapon.rarity,
      rarityColor: this.weapon.rarityColor,
      cooldownFraction: this.getCooldownFraction(),
      equipped: true,
      weaponTextureKey: this.weapon.textureKey,
    };
  }

  getWeapon(): Weapon | null {
    return this.weapon;
  }
}
