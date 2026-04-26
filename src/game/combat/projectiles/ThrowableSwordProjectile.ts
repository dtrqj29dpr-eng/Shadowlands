import Phaser from 'phaser';
import type { Weapon } from '../Weapon';
import type { ProjectilePhase } from '../../types/GameTypes';

// Minimal interface so the projectile can notify its owner slot without a circular import.
export interface IWeaponSlotCallback {
  onProjectileReturned(): void;
}

// Minimal interface for enemy hit detection — avoids importing BaseEnemy here.
export interface IHittable {
  takeDamage(amount: number, kbX: number, kbY: number): void;
}

export class ThrowableSwordProjectile extends Phaser.Physics.Arcade.Sprite {
  private phase: ProjectilePhase = 'IDLE';
  private weapon!: Weapon;
  private slot!: IWeaponSlotCallback;
  private hitEntities: Set<IHittable> = new Set();
  private pierceRemaining: number = 0;
  private travelTargetX: number = 0;
  private travelTargetY: number = 0;
  private ownerX: number = 0;
  private ownerY: number = 0;
  // Reference to get live player position for homing return.
  private getOwnerPos!: () => { x: number; y: number };

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
  ) {
    this.weapon = weapon;
    this.slot = slot;
    this.getOwnerPos = getOwnerPos;
    this.pierceRemaining = weapon.pierce;
    this.hitEntities = new Set();
  }

  launch(targetX: number, targetY: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setEnable(true);

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);

    // The sword travels to a fixed world point (origin + direction × maxRange),
    // not toward the cursor itself, so it always travels the full arc.
    this.travelTargetX = this.x + Math.cos(angle) * this.weapon.maxRange;
    this.travelTargetY = this.y + Math.sin(angle) * this.weapon.maxRange;

    this.setActive(true);
    this.setVisible(true);
    this.phase = 'TRAVELING';
    this.setRotation(angle);

    body.setVelocity(
      Math.cos(angle) * this.weapon.throwSpeed,
      Math.sin(angle) * this.weapon.throwSpeed,
    );
  }

  update(_time: number, _delta: number) {
    if (!this.active) return;

    if (this.phase === 'TRAVELING') {
      this.tickTraveling();
    } else if (this.phase === 'RETURNING') {
      this.tickReturning();
    }
  }

  private tickTraveling() {
    const dist = Phaser.Math.Distance.Between(
      this.x, this.y, this.travelTargetX, this.travelTargetY,
    );
    this.angle += 14;
    if (dist < 18) {
      this.beginReturn();
    }
  }

  private beginReturn() {
    this.phase = 'RETURNING';
    // Do NOT clear hitEntities — the sword shouldn't re-hit on the way back.
  }

  private tickReturning() {
    const pos = this.getOwnerPos();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, pos.x, pos.y);

    this.angle -= 14;

    if (dist < 22) {
      this.arrive();
      return;
    }

    const angle = Phaser.Math.Angle.Between(this.x, this.y, pos.x, pos.y);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.weapon.returnSpeed,
      Math.sin(angle) * this.weapon.returnSpeed,
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

    // Remove from group and destroy safely.
    if (this.parentContainer) {
      this.parentContainer.remove(this, true);
    }
    this.destroy();
  }

  /** Called by CollisionSystem when this projectile overlaps an enemy. */
  onHitEnemy(enemy: IHittable, ownerX: number, ownerY: number) {
    if (this.phase !== 'TRAVELING') return;
    if (this.hitEntities.has(enemy)) return;

    this.hitEntities.add(enemy);

    const sprite = enemy as unknown as Phaser.GameObjects.Sprite;
    const angle = Phaser.Math.Angle.Between(ownerX, ownerY, sprite.x, sprite.y);
    enemy.takeDamage(
      this.weapon.damage,
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
