import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/GameConfig';
import { WeaponFactory } from '../../combat/WeaponFactory';
import type { InventorySystem } from '../../systems/InventorySystem';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private isOpen: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chest-closed');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  tryInteract(player: { x: number; y: number }, inventory: InventorySystem, time: number): boolean {
    if (this.isOpen) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > GAME_CONFIG.chest.interactRange) return false;
    this.open(inventory, time);
    return true;
  }

  private open(inventory: InventorySystem, _time: number) {
    this.isOpen = true;
    this.setTexture('chest-open');

    // Generate loot. Future: randomise rarity, pick from a weighted loot table.
    const loot = [
      WeaponFactory.create('wooden_sword', 'Common'),
      WeaponFactory.create('wooden_sword', 'Common'),
    ];

    for (const weapon of loot) {
      inventory.addWeapon(weapon);
    }

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
