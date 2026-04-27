import Phaser from 'phaser';
import type { Weapon } from '../combat/Weapon';
import { GAME_FONT_FAMILY } from '../config/FontConfig';

const X        = 8;
const START_Y  = 56;
const ENTRY_W  = 168;
const ENTRY_H  = 34;
const STRIDE   = ENTRY_H + 4;
const MAX      = 5;
const HOLD_MS  = 2500;
const FADE_MS  = 500;
const PANEL_BG = 0x07080f;

export class LootFeed {
  private scene: Phaser.Scene;
  private entries: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showItem(weapon: Weapon) {
    if (this.entries.length >= MAX) {
      this.entries.shift()!.destroy();
      this.reposition();
    }

    const container = this.buildEntry(weapon, START_Y + this.entries.length * STRIDE);
    this.entries.push(container);

    this.scene.time.delayedCall(HOLD_MS, () => {
      if (!container.scene) return;
      this.scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: FADE_MS,
        onComplete: () => {
          const i = this.entries.indexOf(container);
          if (i !== -1) this.entries.splice(i, 1);
          container.destroy();
          this.reposition();
        },
      });
    });
  }

  private buildEntry(weapon: Weapon, y: number): Phaser.GameObjects.Container {
    const rarityHex = `#${weapon.rarityColor.toString(16).padStart(6, '0')}`;

    const gfx = this.scene.add.graphics();
    gfx.fillStyle(PANEL_BG, 0.9);
    gfx.fillRect(0, 0, ENTRY_W, ENTRY_H);
    gfx.lineStyle(1, weapon.rarityColor, 1);
    gfx.strokeRect(0, 0, ENTRY_W, ENTRY_H);

    const icon = this.scene.add.image(ENTRY_H / 2, ENTRY_H / 2, weapon.textureKey)
      .setScale(1.0)
      .setRotation(-Math.PI / 4);

    const label = this.scene.add.text(ENTRY_H + 6, ENTRY_H / 2, weapon.displayName, {
      fontFamily: GAME_FONT_FAMILY,
      fontSize: '10px',
      color: rarityHex,
    }).setOrigin(0, 0.5);

    const container = this.scene.add.container(X, y, [gfx, icon, label]);
    return container;
  }

  destroy() {
    this.entries.forEach(c => c.destroy());
    this.entries = [];
  }

  private reposition() {
    this.entries.forEach((c, i) => {
      this.scene.tweens.add({
        targets: c,
        y: START_Y + i * STRIDE,
        duration: 150,
        ease: 'Cubic.easeOut',
      });
    });
  }
}
