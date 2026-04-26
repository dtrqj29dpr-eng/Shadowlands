import Phaser from 'phaser';
import type { TooltipItemData } from '../types/GameTypes';
import { GAME_CONFIG } from '../config/GameConfig';

const VW = GAME_CONFIG.viewport.width;
const VH = GAME_CONFIG.viewport.height;

const TOOLTIP_W = 200;
const PAD = 12;
const ROW_GAP = 4;
const PANEL_BG = 0x07080f;

export class ItemTooltip {
  private container: Phaser.GameObjects.Container;
  private currentHeight = 0;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setDepth(2000);
    this.container.setVisible(false);
  }

  /** Show the tooltip with the given data, positioned near the cursor. */
  show(data: TooltipItemData, cursorX: number, cursorY: number): void {
    this.currentHeight = this.rebuild(data);
    this.setPos(cursorX, cursorY);
    this.container.setVisible(true);
  }

  /** Reposition to follow cursor while hovered (call from pointermove). */
  moveTo(cursorX: number, cursorY: number): void {
    if (this.container.visible) this.setPos(cursorX, cursorY);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  // ── Private helpers ──────────────────────────────────────────────

  private setPos(cursorX: number, cursorY: number): void {
    const offset = 14;
    let x = cursorX - TOOLTIP_W / 2;
    let y = cursorY - this.currentHeight - offset;

    x = Math.max(4, Math.min(VW - TOOLTIP_W - 4, x));
    // If tooltip would clip above the top edge, flip below cursor instead.
    y = y < 4 ? cursorY + offset : y;
    y = Math.min(VH - this.currentHeight - 4, y);

    this.container.setPosition(x, y);
  }

  private rebuild(data: TooltipItemData): number {
    // Destroy previous children so the container can be rebuilt fresh.
    this.container.removeAll(true);

    // Use scene.add.* so Phaser properly initialises each object.
    // Container.add() (exclusive mode) then moves them from the display list
    // into the container, preventing double-rendering.
    const scene = this.container.scene;
    const colorHex = `#${data.rarityColor.toString(16).padStart(6, '0')}`;
    let y = PAD;

    // ── Name ──────────────────────────────────────────────────────
    const nameTxt = scene.add.text(PAD, y, data.name, {
      fontSize: '13px', color: '#ddeeff', fontFamily: 'monospace', fontStyle: 'bold',
    });
    y += nameTxt.height + 3;

    // ── Rarity ────────────────────────────────────────────────────
    const rarityTxt = scene.add.text(PAD, y, data.rarity, {
      fontSize: '10px', color: colorHex, fontFamily: 'monospace',
    });
    y += rarityTxt.height + 8;

    const div1Y = y;
    y += 6;

    // ── Item type ─────────────────────────────────────────────────
    const typeTxt = scene.add.text(PAD, y, data.itemType, {
      fontSize: '10px', color: '#778899', fontFamily: 'monospace',
    });
    y += typeTxt.height + 2;

    // ── Attack type ───────────────────────────────────────────────
    const atkTxt = scene.add.text(PAD, y, data.attackType, {
      fontSize: '9px', color: '#5566aa', fontFamily: 'monospace',
    });
    y += atkTxt.height + 8;

    const div2Y = y;
    y += 6;

    // ── Stat rows ─────────────────────────────────────────────────
    const statObjects: Phaser.GameObjects.Text[] = [];
    for (const stat of data.stats) {
      const lbl = scene.add.text(PAD, y, stat.label, {
        fontSize: '10px', color: '#667788', fontFamily: 'monospace',
      });
      const val = scene.add.text(TOOLTIP_W - PAD, y, stat.value, {
        fontSize: '10px', color: '#ddeeff', fontFamily: 'monospace',
      }).setOrigin(1, 0);
      statObjects.push(lbl, val);
      y += lbl.height + ROW_GAP;
    }

    y += PAD - ROW_GAP; // bottom padding
    const totalHeight = y;

    // ── Background (behind everything) ────────────────────────────
    const bg = scene.add.graphics();
    bg.fillStyle(PANEL_BG, 0.97);
    bg.fillRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(2, data.rarityColor, 1);
    bg.strokeRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(1, 0x2a3450, 0.65);
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div1Y, TOOLTIP_W - PAD, div1Y));
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div2Y, TOOLTIP_W - PAD, div2Y));

    // Add bg first so it renders behind text.
    this.container.add(bg);
    this.container.add([nameTxt, rarityTxt, typeTxt, atkTxt, ...statObjects]);

    return totalHeight;
  }
}
