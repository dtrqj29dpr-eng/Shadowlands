import Phaser from 'phaser';
import { BaseEnemy, type IEnemySceneContext } from './BaseEnemy';
import { ENEMY_DEFINITIONS } from '../../config/EnemyConfig';

export class Slime extends BaseEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number, ctx: IEnemySceneContext) {
    super(scene, x, y, 'slime', ENEMY_DEFINITIONS['slime'], ctx);

    // Hitbox center for 36×30 sprite: (18, 15) → offset = (18−r, 15−r)
    (this.body as Phaser.Physics.Arcade.Body).setCircle(11, 7, 4);

    // Gentle bobbing tween — purely cosmetic, doesn't affect physics body.
    scene.tweens.add({
      targets: this,
      scaleY: 0.82,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
