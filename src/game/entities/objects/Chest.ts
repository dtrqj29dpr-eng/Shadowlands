import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/GameConfig';
import { WeaponFactory } from '../../combat/WeaponFactory';
import type { Player } from '../Player';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private isOpen: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chest-closed');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body — chest doesn't move
  }

  /**
   * Called by GameScene when the player presses E.
   * The loot granted here is intentionally isolated from the equip logic
   * so future versions can show a choice screen, add random rarities, etc.
   */
  tryInteract(player: Player, time: number): boolean {
    if (this.isOpen) return false;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > GAME_CONFIG.chest.interactRange) return false;

    this.open(player, time);
    return true;
  }

  private open(player: Player, _time: number) {
    this.isOpen = true;
    this.setTexture('chest-open');

    // Future: randomize rarities, pick from a loot table, show a choice UI.
    const sword1 = WeaponFactory.create('wooden_sword', 'Common');
    const sword2 = WeaponFactory.create('wooden_sword', 'Common');
    player.equipWeapon(sword1, 1);
    player.equipWeapon(sword2, 2);

    // Small pop animation to signal the chest opened.
    this.scene.tweens.add({
      targets: this,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  get opened(): boolean {
    return this.isOpen;
  }
}
