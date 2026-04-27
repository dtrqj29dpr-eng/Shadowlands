import Phaser from 'phaser';
import type { TooltipItemData } from '../types/GameTypes';
import { GAME_FONT_FAMILY } from '../config/FontConfig';

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

  destroy(): void {
    this.container.destroy(true);
  }

  // ── Private helpers ──────────────────────────────────────────────

  private setPos(cursorX: number, cursorY: number): void {
    const vw = this.container.scene.scale.width;
    const vh = this.container.scene.scale.height;
    const offset = 14;
    let x = cursorX - TOOLTIP_W / 2;
    let y = cursorY - this.currentHeight - offset;

    x = Math.max(4, Math.min(vw - TOOLTIP_W - 4, x));
    // If tooltip would clip above the top edge, flip below cursor instead.
    y = y < 4 ? cursorY + offset : y;
    y = Math.min(vh - this.currentHeight - 4, y);

    this.container.setPosition(x, y);
  }

  private rebuild(data: TooltipItemData): number {
    this.container.removeAll(true);
    const scene = this.container.scene;
    const colorHex = `#${data.rarityColor.toString(16).padStart(6, '0')}`;
    let y = PAD;

    const nameTxt = scene.add.text(PAD, y, data.name, {
      fontSize: '13px', color: '#ddeeff', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    });
    y += nameTxt.height + 3;

    const bg = scene.add.graphics();

    if (data.rarityAtBottom) {
      // Inventory layout: name → divider → stats → divider → rarity
      const div1Y = y;
      y += 6;

      const statObjects: Phaser.GameObjects.Text[] = [];
      for (const stat of data.stats) {
        const lbl = scene.add.text(PAD, y, stat.label, {
          fontSize: '10px', color: '#667788', fontFamily: GAME_FONT_FAMILY,
        });
        const val = scene.add.text(TOOLTIP_W - PAD, y, stat.value, {
          fontSize: '10px', color: '#ddeeff', fontFamily: GAME_FONT_FAMILY,
        }).setOrigin(1, 0);
        statObjects.push(lbl, val);
        y += lbl.height + ROW_GAP;
      }

      y += PAD - ROW_GAP;
      const div2Y = y;
      y += 6;

      const rarityTxt = scene.add.text(PAD, y, data.rarity, {
        fontSize: '10px', color: colorHex, fontFamily: GAME_FONT_FAMILY,
      });
      y += rarityTxt.height + PAD;
      const totalHeight = y;

      bg.fillStyle(PANEL_BG, 0.97);
      bg.fillRect(0, 0, TOOLTIP_W, totalHeight);
      bg.lineStyle(2, data.rarityColor, 1);
      bg.strokeRect(0, 0, TOOLTIP_W, totalHeight);
      bg.lineStyle(1, 0x2a3450, 0.65);
      bg.strokeLineShape(new Phaser.Geom.Line(PAD, div1Y, TOOLTIP_W - PAD, div1Y));
      bg.strokeLineShape(new Phaser.Geom.Line(PAD, div2Y, TOOLTIP_W - PAD, div2Y));

      this.container.add(bg);
      this.container.add([nameTxt, ...statObjects, rarityTxt]);

      return totalHeight;
    }

    // HUD layout: name → rarity → divider → item type + attack type → divider → stats
    const rarityTxt = scene.add.text(PAD, y, data.rarity, {
      fontSize: '10px', color: colorHex, fontFamily: GAME_FONT_FAMILY,
    });
    y += rarityTxt.height + 8;

    const div1Y = y;
    y += 6;

    const typeTxt = scene.add.text(PAD, y, data.itemType ?? '', {
      fontSize: '10px', color: '#778899', fontFamily: GAME_FONT_FAMILY,
    });
    y += typeTxt.height + 2;

    const atkTxt = scene.add.text(PAD, y, data.attackType ?? '', {
      fontSize: '9px', color: '#5566aa', fontFamily: GAME_FONT_FAMILY,
    });
    y += atkTxt.height + 8;

    const div2Y = y;
    y += 6;

    const statObjects: Phaser.GameObjects.Text[] = [];
    for (const stat of data.stats) {
      const lbl = scene.add.text(PAD, y, stat.label, {
        fontSize: '10px', color: '#667788', fontFamily: GAME_FONT_FAMILY,
      });
      const val = scene.add.text(TOOLTIP_W - PAD, y, stat.value, {
        fontSize: '10px', color: '#ddeeff', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(1, 0);
      statObjects.push(lbl, val);
      y += lbl.height + ROW_GAP;
    }

    y += PAD - ROW_GAP;
    const totalHeight = y;

    bg.fillStyle(PANEL_BG, 0.97);
    bg.fillRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(2, data.rarityColor, 1);
    bg.strokeRect(0, 0, TOOLTIP_W, totalHeight);
    bg.lineStyle(1, 0x2a3450, 0.65);
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div1Y, TOOLTIP_W - PAD, div1Y));
    bg.strokeLineShape(new Phaser.Geom.Line(PAD, div2Y, TOOLTIP_W - PAD, div2Y));

    this.container.add(bg);
    this.container.add([nameTxt, rarityTxt, typeTxt, atkTxt, ...statObjects]);

    return totalHeight;
  }
}
