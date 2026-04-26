import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.generateTextures();
    this.scene.start('GameScene');
  }

  private generateTextures() {
    // All game textures are generated programmatically here so no external
    // assets are required. Replace texture keys with real sprite atlases later.
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // ── Player ──────────────────────────────────────────────────
    // Dark-blue body circle with a white forward-indicator triangle.
    gfx.fillStyle(0x2255bb);
    gfx.fillCircle(16, 16, 14);
    gfx.fillStyle(0xffffff);
    // Triangle pointing right (the sprite rotates to face the cursor).
    gfx.fillTriangle(26, 16, 16, 10, 16, 22);
    gfx.generateTexture('player', 32, 32);
    gfx.clear();

    // ── Slime ───────────────────────────────────────────────────
    gfx.fillStyle(0x33cc44);
    gfx.fillEllipse(14, 13, 26, 20);
    // Eyes.
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(8,  9, 3);
    gfx.fillCircle(20, 9, 3);
    gfx.fillStyle(0x111111);
    gfx.fillCircle(9,  9, 1.5);
    gfx.fillCircle(21, 9, 1.5);
    gfx.generateTexture('slime', 28, 24);
    gfx.clear();

    // ── Sword projectile ─────────────────────────────────────────
    // Oriented horizontally; Phaser rotates it to match throw angle.
    gfx.fillStyle(0xaa7733); // wood handle
    gfx.fillRect(0, 2, 6, 4);
    gfx.fillStyle(0xccccaa); // blade
    gfx.fillRect(6, 1, 18, 6);
    gfx.generateTexture('sword-projectile', 24, 8);
    gfx.clear();

    // ── Chest closed ─────────────────────────────────────────────
    gfx.fillStyle(0x8b5a2b); // brown body
    gfx.fillRect(2, 12, 36, 22);
    gfx.fillStyle(0x5a3a1a); // dark lid
    gfx.fillRect(2, 2, 36, 12);
    gfx.fillStyle(0xffcc00); // gold latch
    gfx.fillCircle(20, 18, 4);
    gfx.lineStyle(1, 0x3a2a0a);
    gfx.strokeRect(2, 2, 36, 32);
    gfx.generateTexture('chest-closed', 40, 36);
    gfx.clear();

    // ── Chest open ───────────────────────────────────────────────
    gfx.fillStyle(0x8b5a2b);
    gfx.fillRect(2, 12, 36, 22);
    gfx.fillStyle(0x5a3a1a); // lid angled back (simplified as smaller strip at top)
    gfx.fillRect(2, 2, 36, 6);
    gfx.fillStyle(0xffe8a0); // visible interior glow
    gfx.fillRect(4, 8, 32, 6);
    gfx.lineStyle(1, 0x3a2a0a);
    gfx.strokeRect(2, 2, 36, 32);
    gfx.generateTexture('chest-open', 40, 36);
    gfx.clear();

    // ── Coin ────────────────────────────────────────────────────
    gfx.fillStyle(0xffcc00);
    gfx.fillCircle(8, 8, 7);
    gfx.fillStyle(0xffe566);
    gfx.fillCircle(7, 6, 3); // highlight
    gfx.generateTexture('coin', 16, 16);
    gfx.clear();

    // ── Obstacle ─────────────────────────────────────────────────
    // Generic gray circle used for rocks/trees (tinted differently per instance).
    gfx.fillStyle(0x888888);
    gfx.fillCircle(24, 24, 22);
    gfx.fillStyle(0xaaaaaa);
    gfx.fillCircle(20, 18, 8); // highlight
    gfx.generateTexture('obstacle', 48, 48);
    gfx.clear();

    gfx.destroy();

    // Uncomment to debug texture generation:
    // console.log('[BootScene] Textures generated.');
  }
}
