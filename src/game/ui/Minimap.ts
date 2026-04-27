import Phaser from 'phaser';
import type { MinimapData } from '../types/GameTypes';

// ── Style ─────────────────────────────────────────────────────────────────────

const BG_COLOR      = 0x07080f;
const BORDER_COLOR  = 0x2a3450;
const HIGHLIGHT     = 0x3a4a6a;

const PLAYER_GLOW   = 0x4499ff;
const PLAYER_DOT    = 0x88ccff;
const ENEMY_DOT     = 0xee3333;
const CHEST_CLOSED  = 0xffcc44;
const CHEST_OPEN    = 0x445566;
const COIN_DOT      = 0xeecc22;
const CAM_RECT      = 0xffffff;

// ── Minimap ───────────────────────────────────────────────────────────────────

export class Minimap {
  private readonly gfx: Phaser.GameObjects.Graphics;
  private readonly x: number;
  private readonly y: number;
  private readonly size: number;
  private static readonly PAD = 4;
  private static readonly MAX_COINS = 60;

  constructor(scene: Phaser.Scene, x: number, y: number, size: number) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.gfx  = scene.add.graphics();
  }

  update(d: MinimapData) {
    const { gfx, x, y, size } = this;
    const PAD   = Minimap.PAD;
    const inner = size - PAD * 2;

    // Clamp helpers (for the camera rect, dots, etc.)
    const clampX = (v: number) => Math.max(x + PAD, Math.min(x + size - PAD, v));
    const clampY = (v: number) => Math.max(y + PAD, Math.min(y + size - PAD, v));

    const toMap = (wx: number, wy: number) => ({
      mx: x + PAD + (wx / d.worldWidth)  * inner,
      my: y + PAD + (wy / d.worldHeight) * inner,
    });

    gfx.clear();

    // ── Frame ──────────────────────────────────────────────────────────────────
    gfx.fillStyle(BG_COLOR, 0.92);
    gfx.fillRect(x, y, size, size);
    gfx.lineStyle(1, BORDER_COLOR, 0.9);
    gfx.strokeRect(x, y, size, size);
    gfx.lineStyle(1, HIGHLIGHT, 0.4);
    gfx.strokeLineShape(new Phaser.Geom.Line(x + 1, y + 1, x + size - 1, y + 1));

    // ── Camera viewport rect ───────────────────────────────────────────────────
    const camTL = toMap(d.cameraScrollX,               d.cameraScrollY);
    const camBR = toMap(d.cameraScrollX + d.cameraWidth, d.cameraScrollY + d.cameraHeight);
    const cvX = clampX(camTL.mx);
    const cvY = clampY(camTL.my);
    const cvW = Math.max(2, clampX(camBR.mx) - cvX);
    const cvH = Math.max(2, clampY(camBR.my) - cvY);
    gfx.fillStyle(CAM_RECT, 0.06);
    gfx.fillRect(cvX, cvY, cvW, cvH);
    gfx.lineStyle(1, CAM_RECT, 0.22);
    gfx.strokeRect(cvX, cvY, cvW, cvH);

    // ── Coins ──────────────────────────────────────────────────────────────────
    const coinList = d.coins.length > Minimap.MAX_COINS
      ? (d.coins as Array<{ x: number; y: number }>).slice(0, Minimap.MAX_COINS)
      : d.coins;
    gfx.fillStyle(COIN_DOT, 0.55);
    for (const c of coinList) {
      const { mx, my } = toMap(c.x, c.y);
      gfx.fillCircle(mx, my, 1.5);
    }

    // ── Chest ─────────────────────────────────────────────────────────────────
    if (d.chest) {
      const { mx, my } = toMap(d.chest.x, d.chest.y);
      gfx.fillStyle(d.chest.opened ? CHEST_OPEN : CHEST_CLOSED, d.chest.opened ? 0.6 : 0.95);
      gfx.fillRect(mx - 2, my - 2, 5, 5);
    }

    // ── Enemies ───────────────────────────────────────────────────────────────
    gfx.fillStyle(ENEMY_DOT, 0.90);
    for (const e of d.enemies) {
      const { mx, my } = toMap(e.x, e.y);
      gfx.fillCircle(mx, my, 2);
    }

    // ── Player ────────────────────────────────────────────────────────────────
    const { mx: px, my: py } = toMap(d.playerX, d.playerY);
    gfx.fillStyle(PLAYER_GLOW, 0.20);
    gfx.fillCircle(px, py, 5);
    gfx.fillStyle(PLAYER_DOT, 1);
    gfx.fillCircle(px, py, 3);
  }

  destroy() {
    this.gfx.destroy();
  }
}
