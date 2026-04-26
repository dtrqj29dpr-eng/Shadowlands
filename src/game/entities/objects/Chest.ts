import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/GameConfig';
import { WeaponFactory } from '../../combat/WeaponFactory';
import type { Player } from '../Player';
import type { InventorySystem } from '../../systems/InventorySystem';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private isOpen: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chest-closed');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  tryInteract(player: Player, inventory: InventorySystem, time: number): boolean {
    if (this.isOpen) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > GAME_CONFIG.chest.interactRange) return false;
    this.open(player, inventory, time);
    return true;
  }

  private open(player: Player, inventory: InventorySystem, _time: number) {
    this.isOpen = true;
    this.setTexture('chest-open');

    // Generate loot. Future: randomise rarity, pick from a weighted loot table.
    const loot = [
      WeaponFactory.create('wooden_sword', 'Common'),
      WeaponFactory.create('wooden_sword', 'Common'),
    ];

    // All loot goes into inventory first.
    for (const weapon of loot) {
      inventory.addWeapon(weapon);
    }

    // Auto-equip from inventory into any empty active slots.
    this.autoEquipFromInventory(player, inventory);

    this.scene.tweens.add({
      targets: this,
      scaleY: 1.2,
      duration: 80,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  private autoEquipFromInventory(player: Player, inventory: InventorySystem) {
    const weapons = inventory.getAll();
    for (let i = 0; i < weapons.length; i++) {
      const w = weapons[i];
      if (!w) continue;
      if (!player.getEquippedWeapon(1)) {
        inventory.removeAt(i);
        player.equipWeapon(w, 1);
      } else if (!player.getEquippedWeapon(2)) {
        inventory.removeAt(i);
        player.equipWeapon(w, 2);
      }
    }
  }

  get opened(): boolean {
    return this.isOpen;
  }
}
