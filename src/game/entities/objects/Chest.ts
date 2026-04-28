import Phaser from 'phaser';
import { GAME_CONFIG } from '../../config/GameConfig';
import { WeaponFactory } from '../../combat/WeaponFactory';
import type { InventorySystem } from '../../systems/InventorySystem';
import type { CraftingInventory } from '../../systems/CraftingInventory';

export class Chest extends Phaser.Physics.Arcade.Sprite {
  private isOpen: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chest-closed');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }

  tryInteract(
    player: { x: number; y: number },
    inventory: InventorySystem,
    craftingInventory: CraftingInventory,
    time: number,
  ): boolean {
    if (this.isOpen) return false;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist > GAME_CONFIG.chest.interactRange) return false;
    this.open(inventory, craftingInventory, time);
    return true;
  }

  private open(inventory: InventorySystem, craftingInventory: CraftingInventory, _time: number) {
    this.isOpen = true;
    this.setTexture('chest-open');

    // Weapon loot
    const loot = [
      WeaponFactory.create('wooden_sword', 'Common'),
      WeaponFactory.create('wooden_sword', 'Common'),
    ];
    for (const weapon of loot) {
      if (inventory.addWeapon(weapon)) {
        this.scene.events.emit('lootReceived', weapon);
      }
    }

    // Crafting materials
    craftingInventory.add('wooden_log', 5);
    craftingInventory.add('iron_bar', 5);

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
