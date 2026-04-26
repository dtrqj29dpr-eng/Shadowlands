import Phaser from 'phaser';
import type { PlayerStats, SlotData } from '../types/GameTypes';
import { GAME_CONFIG } from '../config/GameConfig';

const VW = GAME_CONFIG.viewport.width;
const VH = GAME_CONFIG.viewport.height;

export class HUD {
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBarFg: Phaser.GameObjects.Rectangle;
  private hpText: Phaser.GameObjects.Text;
  private coinText: Phaser.GameObjects.Text;
  private interactPrompt: Phaser.GameObjects.Text;
  private slotBoxes: Phaser.GameObjects.Rectangle[];
  private slotOverlays: Phaser.GameObjects.Rectangle[];
  private slotNameTexts: Phaser.GameObjects.Text[];
  private slotControlTexts: Phaser.GameObjects.Text[];

  private readonly HP_BAR_W = 180;
  private readonly HP_BAR_H = 14;
  private readonly SLOT_SIZE = 52;

  constructor(scene: Phaser.Scene) {
    // ── HP bar ──────────────────────────────────────────────────
    this.hpBarBg = scene.add.rectangle(
      20 + this.HP_BAR_W / 2, 24,
      this.HP_BAR_W, this.HP_BAR_H,
      0x440000,
    ).setOrigin(0.5, 0.5);

    this.hpBarFg = scene.add.rectangle(
      20, 24,
      this.HP_BAR_W, this.HP_BAR_H,
      0xee2222,
    ).setOrigin(0, 0.5);

    this.hpText = scene.add.text(210, 24, '100 / 100', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // ── Coin counter ─────────────────────────────────────────────
    // Small gold circle icon drawn once.
    const coinIcon = scene.add.graphics();
    coinIcon.fillStyle(0xffcc00);
    coinIcon.fillCircle(VW - 130, 24, 7);

    this.coinText = scene.add.text(VW - 120, 24, 'x 0', {
      fontSize: '14px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // ── Weapon slots ─────────────────────────────────────────────
    const slotY = VH - 60;
    const slotGap = 8;
    const totalW = this.SLOT_SIZE * 2 + slotGap;
    const slot1X = VW / 2 - totalW / 2;
    const slot2X = slot1X + this.SLOT_SIZE + slotGap;
    const slotXs = [slot1X, slot2X];

    this.slotBoxes = [];
    this.slotOverlays = [];
    this.slotNameTexts = [];
    this.slotControlTexts = [];

    for (let i = 0; i < 2; i++) {
      const sx = slotXs[i];

      // Outline box.
      const box = scene.add.rectangle(
        sx, slotY, this.SLOT_SIZE, this.SLOT_SIZE, 0x000000, 0.5,
      ).setOrigin(0, 0.5);
      box.setStrokeStyle(2, 0x555555);
      this.slotBoxes.push(box);

      // Cooldown overlay (semi-transparent, shrinks from top).
      const overlay = scene.add.rectangle(
        sx, slotY - this.SLOT_SIZE / 2, this.SLOT_SIZE, this.SLOT_SIZE, 0x000000, 0.65,
      ).setOrigin(0, 0).setVisible(false);
      this.slotOverlays.push(overlay);

      // Weapon name.
      const nameText = scene.add.text(
        sx + this.SLOT_SIZE / 2, slotY + this.SLOT_SIZE / 2 + 6,
        'Empty', {
          fontSize: '9px',
          color: '#888888',
          fontFamily: 'monospace',
        },
      ).setOrigin(0.5, 0);
      this.slotNameTexts.push(nameText);

      // LMB / RMB label.
      const ctrlText = scene.add.text(
        sx + this.SLOT_SIZE / 2, slotY - this.SLOT_SIZE / 2 - 14,
        i === 0 ? 'LMB' : 'RMB', {
          fontSize: '9px',
          color: '#666666',
          fontFamily: 'monospace',
        },
      ).setOrigin(0.5, 0);
      this.slotControlTexts.push(ctrlText);
    }

    // ── Interaction prompt ────────────────────────────────────────
    this.interactPrompt = scene.add.text(VW / 2, VH / 2 + 60, 'Press E to open chest', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setVisible(false);
  }

  update(
    stats: PlayerStats,
    coins: number,
    slot1Data: SlotData,
    slot2Data: SlotData,
    showInteractPrompt: boolean,
  ) {
    // HP bar.
    const hpFrac = Math.max(0, stats.hp / stats.maxHp);
    this.hpBarFg.setSize(this.HP_BAR_W * hpFrac, this.HP_BAR_H);
    this.hpText.setText(`${stats.hp} / ${stats.maxHp}`);

    // Coin counter.
    this.coinText.setText(`x ${coins}`);

    // Weapon slots.
    this.updateSlot(0, slot1Data);
    this.updateSlot(1, slot2Data);

    // Interaction prompt.
    this.interactPrompt.setVisible(showInteractPrompt);
  }

  private updateSlot(index: 0 | 1, data: SlotData) {
    const box = this.slotBoxes[index];
    const overlay = this.slotOverlays[index];
    const nameText = this.slotNameTexts[index];
    const color = `#${data.rarityColor.toString(16).padStart(6, '0')}`;

    if (data.equipped) {
      box.setStrokeStyle(2, data.rarityColor);
      nameText.setText(`${data.weaponName}\n${data.rarity}`).setColor(color);
    } else {
      box.setStrokeStyle(2, 0x444444);
      nameText.setText('Empty').setColor('#555555');
    }

    const frac = data.cooldownFraction;
    if (frac > 0.01) {
      overlay.setVisible(true);
      overlay.setSize(this.SLOT_SIZE, this.SLOT_SIZE * frac);
    } else {
      overlay.setVisible(false);
    }
  }
}
