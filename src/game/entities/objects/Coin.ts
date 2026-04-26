import Phaser from 'phaser';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  readonly value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number = 1) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.value = value;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravityY(260);
    body.setDrag(60, 60);
    body.setVelocity(
      (Math.random() - 0.5) * 140,
      -70 - Math.random() * 60,
    );

    // Flicker/spin tween for visual interest.
    scene.tweens.add({
      targets: this,
      scaleX: 0.1,
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect() {
    this.destroy();
  }
}
