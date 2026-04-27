import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import type { GameScene } from './GameScene';
import type { Weapon } from '../combat/Weapon';
import type { MinimapData } from '../types/GameTypes';
import { GAME_CONFIG } from '../config/GameConfig';

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
    const { player, resourceSystem } = this.gameScene;
    if (!player) return;

    const cam = this.gameScene.cameras.main;
    const { width: wW, height: wH } = GAME_CONFIG.world;

    const enemies = this.gameScene.enemyGroup.getChildren()
      .filter(e => e.active)
      .map(e => ({ x: (e as unknown as { x: number }).x, y: (e as unknown as { y: number }).y }));

    const coins = this.gameScene.coinGroup.getChildren()
      .filter(c => c.active)
      .map(c => ({ x: (c as unknown as { x: number }).x, y: (c as unknown as { y: number }).y }));

    const minimapData: MinimapData = {
      worldWidth:    wW,
      worldHeight:   wH,
      playerX:       player.x,
      playerY:       player.y,
      enemies,
      chest:         this.gameScene.getChestData(),
      coins,
      cameraScrollX: cam.scrollX,
      cameraScrollY: cam.scrollY,
      cameraWidth:   cam.width,
      cameraHeight:  cam.height,
    };

    this.hud.update(
      player.getStats(),
      resourceSystem.get('coin'),
      player.getSlotData(1),
      player.getSlotData(2),
      this.gameScene.isNearChest(),
      player.getSlotTooltipData(1),
      player.getSlotTooltipData(2),
      minimapData,
    );
  }
}
