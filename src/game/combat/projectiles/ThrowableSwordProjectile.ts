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

const SPIN_SPEED = 960;           // degrees per second
const DEFLECTION_DURATION_MS = 140;
const DEFLECTION_STRENGTH    = 0.45;

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

  // Deflection on return hit: blend a perpendicular kick into the homing direction.
  private deflectionTimer: number = 0;
  private deflectionDirX: number = 0;
  private deflectionDirY: number = 0;

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
    this.deflectionTimer = 0;
    // Clear so each pass (outbound and return) gets an independent hit window.
    this.hitEntities = new Set();
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

    // Base homing direction (normalized).
    const homeDx = pos.x - this.x;
    const homeDy = pos.y - this.y;
    const homeLen = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
    let dirX = homeDx / homeLen;
    let dirY = homeDy / homeLen;

    // While deflecting, blend the perpendicular kick into the homing direction.
    if (this.deflectionTimer > 0) {
      this.deflectionTimer = Math.max(0, this.deflectionTimer - delta);
      const blendX = dirX + this.deflectionDirX * DEFLECTION_STRENGTH;
      const blendY = dirY + this.deflectionDirY * DEFLECTION_STRENGTH;
      const blendLen = Math.sqrt(blendX * blendX + blendY * blendY);
      dirX = blendX / blendLen;
      dirY = blendY / blendLen;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(dirX * this.currentReturnSpeed, dirY * this.currentReturnSpeed);
    this.setRotation(Math.atan2(dirY, dirX));
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

  /** Returns true while the sword can deal damage (outbound or returning). */
  canHit(): boolean {
    return this.phase === 'TRAVELING' || this.phase === 'RETURNING';
  }

  /** Called by CollisionSystem when this projectile overlaps an enemy. */
  onHitEnemy(enemy: IHittable, ownerX: number, ownerY: number) {
    if (!this.canHit()) return;
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

    if (this.phase === 'TRAVELING') {
      // Outbound: non-pierce hit triggers the return.
      if (this.pierceRemaining <= 0) {
        this.beginReturn();
      } else {
        this.pierceRemaining--;
      }
    } else {
      // Returning: glance off the enemy with a small perpendicular deflection.
      const pos = this.getOwnerPos();
      const homeDx = pos.x - this.x;
      const homeDy = pos.y - this.y;
      const homeLen = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
      // Perpendicular to homing direction, randomly left or right.
      const side = Math.random() < 0.5 ? 1 : -1;
      this.deflectionDirX = (-homeDy / homeLen) * side;
      this.deflectionDirY = (homeDx / homeLen) * side;
      this.deflectionTimer = DEFLECTION_DURATION_MS;
    }
  }

  isInTravelingPhase(): boolean {
    return this.phase === 'TRAVELING';
  }
}
