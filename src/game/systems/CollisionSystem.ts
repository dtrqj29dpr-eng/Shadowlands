import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import type { BaseEnemy } from '../entities/enemies/BaseEnemy';
import type { Coin } from '../entities/objects/Coin';
import { ThrowableSwordProjectile } from '../combat/projectiles/ThrowableSwordProjectile';
import type { ResourceSystem } from './ResourceSystem';

export class CollisionSystem {
  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemyGroup: Phaser.Physics.Arcade.Group,
    projectileGroup: Phaser.Physics.Arcade.Group,
    obstacleGroup: Phaser.Physics.Arcade.StaticGroup,
    coinGroup: Phaser.Physics.Arcade.Group,
    resourceSystem: ResourceSystem,
  ) {
    const phys = scene.physics;

    // Player blocked by obstacles.
    phys.add.collider(player, obstacleGroup);

    // Enemies blocked by obstacles.
    phys.add.collider(enemyGroup, obstacleGroup);

    // Enemies push each other apart (prevents stacking).
    phys.add.collider(enemyGroup, enemyGroup);

    // Projectiles hit enemies (traveling phase only).
    phys.add.overlap(
      projectileGroup,
      enemyGroup,
      (projObj, enemyObj) => {
        const proj = projObj as ThrowableSwordProjectile;
        const enemy = enemyObj as BaseEnemy;
        if (!proj.canHit()) return;
        proj.onHitEnemy(enemy as unknown as import('../combat/projectiles/ThrowableSwordProjectile').IHittable, player.x, player.y);
      },
    );

    // Player takes contact damage from enemies.
    phys.add.overlap(
      player,
      enemyGroup,
      (playerObj, enemyObj) => {
        const e = enemyObj as BaseEnemy;
        const now = scene.time.now;
        if (now - e.lastDamageTime >= e.damageIntervalMs) {
          e.lastDamageTime = now;
          (playerObj as Player).takeDamage(e.contactDamage, now);
        }
      },
    );

    // Player collects coins.
    phys.add.overlap(
      player,
      coinGroup,
      (_playerObj, coinObj) => {
        const coin = coinObj as Coin;
        if (!coin.active) return;
        resourceSystem.add('coin', coin.value);
        coin.collect();
      },
    );
  }
}
