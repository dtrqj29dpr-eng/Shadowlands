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
    // If tooltip would go above top, flip below cursor.
    y = y < 4 ? cursorY + offset : y;
    y = Math.min(VH - this.currentHeight - 4, y);

    this.container.setPosition(x, y);
  }

  private rebuild(data: TooltipItemData): number {
    this.container.removeAll(true);

    const scene = this.container.scene;
    const colorHex = `#${data.rarityColor.toString(16).padStart(6, '0')}`;
    const children: Phaser.GameObjects.GameObject[] = [];
    let y = PAD;

    // ── Item name ──────────────────────────────────────────────────
    const nameTxt = new Phaser.GameObjects.Text(scene, PAD, y, data.name, {
      fontSize: '13px', color: '#ddeeff', fontFamily: 'monospace', fontStyle: 'bold',
    });
    children.push(nameTxt);
    y += nameTxt.height + 3;

    // ── Rarity ─────────────────────────────────────────────────────
    const rarityTxt = new Phaser.GameObjects.Text(scene, PAD, y, data.rarity, {
      fontSize: '10px', color: colorHex, fontFamily: 'monospace',
    });
    children.push(rarityTxt);
    y += rarityTxt.height + 8;

    const div1Y = y;
    y += 6;

    // ── Item type + attack type ────────────────────────────────────
    const typeTxt = new Phaser.GameObjects.Text(scene, PAD, y, data.itemType, {
      fontSize: '10px', color: '#778899', fontFamily: 'monospace',
    });
    children.push(typeTxt);
    y += typeTxt.height + 2;

    const atkTxt = new Phaser.GameObjects.Text(scene, PAD, y, data.attackType, {
      fontSize: '9px', color: '#5566aa', fontFamily: 'monospace',
    });
    children.push(atkTxt);
    y += atkTxt.height + 8;

    const div2Y = y;
    y += 6;

    // ── Stat rows ──────────────────────────────────────────────────
    for (const stat of data.stats) {
      const lbl = new Phaser.GameObjects.Text(scene, PAD, y, stat.label, {
        fontSize: '10px', color: '#667788', fontFamily: 'monospace',
      });
      children.push(lbl);

      const val = new Phaser.GameObjects.Text(scene, TOOLTIP_W - PAD, y, stat.value, {
        fontSize: '10px', color: '#ddeeff', fontFamily: 'monospace',
      });
      val.setOrigin(1, 0);
      children.push(val);

      y += lbl.height + ROW_GAP;
    }

    y += PAD - ROW_GAP; // bottom padding
    const totalHeight = y;

    // ── Background (drawn first, behind text) ─────────────────────
    const bg = new Phaser.GameObjects.Graphics(scene);
    bg.fillStyle(PANEL_BG, 0.97);
    bg.fillRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(2, data.rarityColor, 1);
    bg.strokeRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(1, 0x2a3450, 0.65);
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div1Y, TOOLTIP_W - PAD, div1Y));
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div2Y, TOOLTIP_W - PAD, div2Y));

    this.container.add(bg);
    for (const child of children) this.container.add(child);

    return totalHeight;
  }
}
