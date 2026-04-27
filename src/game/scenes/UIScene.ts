import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { GameScene } from './GameScene';
import type { Weapon } from '../combat/Weapon';

export class UIScene extends Phaser.Scene {
  private hud!: HUD;
  private gameScene!: GameScene;

  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    // GameScene is guaranteed active at this point because UIScene is launched
    // from GameScene.create() after all entities are initialized.
    this.gameScene = this.scene.get('GameScene') as GameScene;
    this.hud = new HUD(this);
    this.gameScene.events.on('lootReceived', (weapon: Weapon) => {
      this.hud.showLootItem(weapon);
    }, this);
    this.scale.on('resize', this.onResize, this);
  }

  private onResize() {
    this.hud.destroy();
    this.hud = new HUD(this);
  }

  update() {
    const { player, resourceSystem, inventorySystem } = this.gameScene;
    if (!player) return;

    this.hud.update(
      player.getStats(),
      resourceSystem.get('coin'),
      player.getSlotData(1),
      player.getSlotData(2),
      this.gameScene.isNearChest(),
      player.getSlotTooltipData(1),
      player.getSlotTooltipData(2),
    );
  }
}
