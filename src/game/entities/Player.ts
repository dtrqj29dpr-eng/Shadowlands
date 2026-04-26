import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { WeaponSlot } from '../combat/WeaponSlot';
import type { Weapon } from '../combat/Weapon';
import type { PlayerStats, SlotData } from '../types/GameTypes';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  readonly maxHp: number;
  private iframeActive: boolean = false;
  private iframeTimer: number = 0;

  readonly slot1: WeaponSlot;
  readonly slot2: WeaponSlot;

  private cursors!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.maxHp = GAME_CONFIG.player.maxHp;
    this.hp = this.maxHp;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setAllowGravity(false);

    const r = GAME_CONFIG.player.hitboxRadius;
    // Center the circular hitbox within the 48×48 sprite.
    body.setCircle(r, 24 - r, 24 - r);

    const kb = scene.input.keyboard!;
    this.cursors = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.slot1 = new WeaponSlot(1);
    this.slot2 = new WeaponSlot(2);
  }

  update(_time: number, delta: number) {
    this.handleMovement();
    this.handleFacing();
    this.updateIframes(delta);
    this.slot1.update(delta);
    this.slot2.update(delta);
  }

  private handleMovement() {
    const speed = GAME_CONFIG.player.speed;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown)  vx -= 1;
    if (this.cursors.right.isDown) vx += 1;
    if (this.cursors.up.isDown)    vy -= 1;
    if (this.cursors.down.isDown)  vy += 1;

    // Normalize diagonal movement so speed is consistent in all directions.
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx * speed, vy * speed);
  }

  private handleFacing() {
    const pointer = this.scene.input.activePointer;
    const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
    this.setRotation(angle);
  }

  takeDamage(amount: number, _time: number) {
    if (this.iframeActive || this.hp <= 0) return;

    this.hp = Math.max(0, this.hp - amount);
    this.iframeActive = true;
    this.iframeTimer = GAME_CONFIG.player.iframeDurationMs;
    this.setTint(0xff4444);
  }

  private updateIframes(delta: number) {
    if (!this.iframeActive) return;
    this.iframeTimer -= delta;
    // Flash effect during iframes.
    this.setAlpha(Math.sin(this.iframeTimer * 0.03) > 0 ? 1 : 0.4);
    if (this.iframeTimer <= 0) {
      this.iframeActive = false;
      this.clearTint();
      this.setAlpha(1);
    }
  }

  fireSlot(
    slotIndex: 1 | 2,
    targetX: number,
    targetY: number,
    projectileGroup: Phaser.Physics.Arcade.Group,
  ) {
    const slot = slotIndex === 1 ? this.slot1 : this.slot2;
    slot.tryFire(
      this.scene,
      this.x,
      this.y,
      targetX,
      targetY,
      () => ({ x: this.x, y: this.y }),
      projectileGroup,
    );
  }

  equipWeapon(weapon: Weapon, slotIndex: 1 | 2) {
    const slot = slotIndex === 1 ? this.slot1 : this.slot2;
    slot.equip(weapon);
  }

  /** Returns the currently equipped Weapon for the given slot, or null if empty. */
  getEquippedWeapon(slotIndex: 1 | 2): Weapon | null {
    return slotIndex === 1 ? this.slot1.getWeapon() : this.slot2.getWeapon();
  }

  /** Clears the given slot (weapon returns to caller — caller must manage inventory). */
  unequipSlot(slotIndex: 1 | 2): Weapon | null {
    const slot = slotIndex === 1 ? this.slot1 : this.slot2;
    const weapon = slot.getWeapon();
    slot.clear();
    return weapon;
  }

  getStats(): PlayerStats {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      iframeActive: this.iframeActive,
    };
  }

  getSlotData(slotIndex: 1 | 2): SlotData {
    return slotIndex === 1 ? this.slot1.getSlotData() : this.slot2.getSlotData();
  }
}
