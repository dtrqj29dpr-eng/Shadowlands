import Phaser from 'phaser';
import { GAME_FONT_FAMILY } from '../config/FontConfig';

export class FloatingCombatText {
  /**
   * Spawns a floating damage / healing number at (x, y) in world space.
   * The text animates upward and fades out, then self-destructs.
   *
   * @param isCritical  Renders larger, gold, with "!" suffix when true.
   */
  static spawn(
    scene: Phaser.Scene,
    x: number,
    y: number,
    amount: number,
    isCritical: boolean,
  ): void {
    const offsetX = (Math.random() - 0.5) * 22;
    const label = isCritical ? `${amount}!` : `${amount}`;

    const txt = scene.add.text(x + offsetX, y - 18, label, {
      fontSize:        isCritical ? '16px' : '13px',
      color:           isCritical ? '#ffdd44' : '#ffffff',
      fontFamily:      GAME_FONT_FAMILY,
      fontStyle:       isCritical ? 'bold' : 'normal',
      stroke:          '#000000',
      strokeThickness: isCritical ? 3 : 2,
    }).setOrigin(0.5, 1).setDepth(20);

    const duration = 650 + Math.random() * 200;

    scene.tweens.add({
      targets: txt,
      y: txt.y - 48,
      alpha: 0,
      duration,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (txt.scene) txt.destroy(); },
    });
  }
}
