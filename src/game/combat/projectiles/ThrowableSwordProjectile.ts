import Phaser from 'phaser';
import type { Weapon } from '../Weapon';
import type { PlayerAttributes, ProjectilePhase } from '../../types/GameTypes';
import { DamageCalculator } from '../DamageCalculator';

// Minimal interface so the projectile can notify its owner slot without a circular import.
export interface IWeaponSlotCallback {
  onProjectileReturned(): void;
}

// Minimal interface for enemy hit detection — avoids importing BaseEnemy here.
export interface IHittable {
  takeDamage(amount: number, kbX: number, kbY: number): void;
}

const SPIN_SPEED = 480; // degrees per second

export class ThrowableSwordProjectile extends Phaser.Physics.Arcade.Sprite {
  private phase: ProjectilePhase = 'IDLE';
  private weapon!: Weapon;
  private slot!: IWeaponSlotCallback;
  private hitEntities: Set<IHittable> = new Set();
  private pierceRemaining: number = 0;

  // Fixed world point the sword travels toward on the outbound arc.
  private travelTargetX: number = 0;
  private travelTargetY: number = 0;

  // Saved outbound direction (normalized). Never recalculated while TRAVELING.
  private throwDirX: number = 0;
  private throwDirY: number = 0;

  // Current homing speed; increases each frame while returning.
  private currentReturnSpeed: number = 0;

  private getOwnerPos!: () => { x: number; y: number };
  private getOwnerAttributes!: () => PlayerAttributes;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'sword-projectile');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    this.setActive(false);
    this.setVisible(false);
  }

  init(
    weapon: Weapon,
    slot: IWeaponSlotCallback,
    getOwnerPos: () => { x: number; y: number },
    getOwnerAttributes: () => PlayerAttributes,
  ) {
    this.weapon = weapon;
    this.slot = slot;
    this.getOwnerPos = getOwnerPos;
    this.getOwnerAttributes = getOwnerAttributes;
    this.pierceRemaining = weapon.pierce;
    this.hitEntities = new Set();
  }

  // Called by WeaponSlot AFTER the projectile has been added to the physics group.
  // The group's createCallbackHandler resets velocity and allowGravity to defaults,
  // so we re-assert them here.
  launch(targetX: number, targetY: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setEnable(true);

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.throwDirX = Math.cos(angle);
    this.throwDirY = Math.sin(angle);

    // Travel toward a fixed world point exactly maxRange away.
    // This keeps the arc consistent regardless of cursor distance.
    this.travelTargetX = this.x + this.throwDirX * this.weapon.maxRange;
    this.travelTargetY = this.y + this.throwDirY * this.weapon.maxRange;

    this.currentReturnSpeed = this.weapon.returnSpeed;

    this.setActive(true);
    this.setVisible(true);
    this.phase = 'TRAVELING';
    this.setRotation(angle);

    // Outbound velocity is set once here and never recalculated — physics carries it forward.
    body.setVelocity(
      this.throwDirX * this.weapon.throwSpeed,
      this.throwDirY * this.weapon.throwSpeed,
    );
  }

  update(_time: number, delta: number) {
    if (!this.active) return;

    if (this.phase === 'TRAVELING') {
      this.tickTraveling(delta);
    } else if (this.phase === 'RETURNING') {
      this.tickReturning(delta);
    }
  }

  private tickTraveling(delta: number) {
    const dist = Phaser.Math.Distance.Between(
      this.x, this.y, this.travelTargetX, this.travelTargetY,
    );

    // Spin forward at a fixed angular rate.
    this.angle += SPIN_SPEED * (delta / 1000);

    if (dist < 18) {
      this.beginReturn();
    }
  }

  private beginReturn() {
    this.phase = 'RETURNING';
    this.currentReturnSpeed = this.weapon.returnSpeed;
    // Do NOT clear hitEntities — the sword should not re-damage on the way back.
  }

  private tickReturning(delta: number) {
    const pos = this.getOwnerPos();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, pos.x, pos.y);

    // Spin backward while returning.
    this.angle -= SPIN_SPEED * (delta / 1000);

    if (dist < this.weapon.catchDistance) {
      this.arrive();
      return;
    }

    // Accelerate homing speed each frame so the player cannot outrun the sword forever.
    this.currentReturnSpeed = Math.min(
      this.currentReturnSpeed + this.weapon.returnAcceleration * (delta / 1000),
      this.weapon.maxReturnSpeed,
    );

    // Recalculate direction toward player every frame for homing.
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pos.x, pos.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.currentReturnSpeed,
      Math.sin(angle) * this.currentReturnSpeed,
    );
    this.setRotation(angle);
  }

  private arrive() {
    this.phase = 'IDLE';
    this.setActive(false);
    this.setVisible(false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    this.slot.onProjectileReturned();
    this.destroy();
  }

  /** Called by CollisionSystem when this projectile overlaps an enemy. */
  onHitEnemy(enemy: IHittable, ownerX: number, ownerY: number) {
    if (this.phase !== 'TRAVELING') return;
    if (this.hitEntities.has(enemy)) return;

    this.hitEntities.add(enemy);

    const sprite = enemy as unknown as Phaser.GameObjects.Sprite;
    const angle = Phaser.Math.Angle.Between(ownerX, ownerY, sprite.x, sprite.y);
    const result = DamageCalculator.calculate(
      this.weapon.damage,
      this.getOwnerAttributes(),
      this.weapon.strength,
    );
    enemy.takeDamage(
      result.finalDamage,
      Math.cos(angle) * this.weapon.knockback,
      Math.sin(angle) * this.weapon.knockback,
    );

    if (this.pierceRemaining <= 0) {
      this.beginReturn();
    } else {
      this.pierceRemaining--;
    }
  }

  isInTravelingPhase(): boolean {
    return this.phase === 'TRAVELING';
  }
}
