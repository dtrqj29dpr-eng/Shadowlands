import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { GameScene } from './GameScene';

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
  }

  update() {
    // Pull model: read state from GameScene each frame.
    // No event bus needed for per-frame HUD data.
    const { player, resourceSystem } = this.gameScene;
    if (!player) return;

    this.hud.update(
      player.getStats(),
      resourceSystem.get('coin'),
      player.getSlotData(1),
      player.getSlotData(2),
      this.gameScene.isNearChest(),
    );
  }
}
