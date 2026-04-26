import Phaser from 'phaser';
import { ThrowableSwordProjectile } from '../combat/projectiles/ThrowableSwordProjectile';

export class CombatSystem {
  constructor(private projectileGroup: Phaser.Physics.Arcade.Group) {}

  // Drive projectile state machines manually — intentionally NOT via runChildUpdate
  // so ordering is guaranteed: state transitions happen before collision callbacks.
  update(time: number, delta: number) {
    const children = this.projectileGroup.getChildren();
    for (const child of children) {
      if (child.active) {
        (child as ThrowableSwordProjectile).update(time, delta);
      }
    }
  }
}
