import Phaser from 'phaser';
import { Slime } from '../entities/enemies/Slime';
import { GAME_CONFIG } from '../config/GameConfig';
import type { IEnemySceneContext } from '../entities/enemies/BaseEnemy';

export class EnemySpawner {
  private spawnTimer: number = 0;

  constructor(
    private scene: Phaser.Scene,
    private enemyGroup: Phaser.Physics.Arcade.Group,
    private ctx: IEnemySceneContext,
  ) {}

  spawnInitial() {
    const { initialCount } = GAME_CONFIG.enemies;
    let spawned = 0;
    let attempts = 0;

    while (spawned < initialCount && attempts < initialCount * 5) {
      attempts++;
      if (this.trySpawnSlime()) spawned++;
    }
  }

  update(_time: number, delta: number) {
    const { maxCount, respawnIntervalMs } = GAME_CONFIG.enemies;

    this.spawnTimer += delta;
    if (
      this.spawnTimer >= respawnIntervalMs &&
      this.enemyGroup.countActive(true) < maxCount
    ) {
      this.spawnTimer = 0;
      this.trySpawnSlime();
    }
  }

  private trySpawnSlime(): boolean {
    const { width: W, height: H } = GAME_CONFIG.world;
    const margin = 150;
    const x = Phaser.Math.Between(margin, W - margin);
    const y = Phaser.Math.Between(margin, H - margin);

    const playerPos = this.ctx.getPlayerPosition();
    const dist = Phaser.Math.Distance.Between(x, y, playerPos.x, playerPos.y);
    if (dist < GAME_CONFIG.enemies.minSpawnDistFromPlayer) return false;

    const slime = new Slime(this.scene, x, y, this.ctx);
    this.enemyGroup.add(slime, true);
    return true;
  }
}
