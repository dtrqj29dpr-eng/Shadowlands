import Phaser from 'phaser';
import type { PlayerStats, SlotData } from '../types/GameTypes';
import { GAME_CONFIG } from '../config/GameConfig';

const VW = GAME_CONFIG.viewport.width;
const VH = GAME_CONFIG.viewport.height;

// Shared dark-fantasy panel style.
const PANEL_BG   = 0x07080f;
const PANEL_EDGE = 0x2a3450;

export class HUD {
  // HP bar
  private hpBarFg!: Phaser.GameObjects.Rectangle;
  private hpBarFgShine!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // Coins
  private coinText!: Phaser.GameObjects.Text;

  // Slots
  private readonly SLOT_SIZE = 56;
  private slotBoxes!: Phaser.GameObjects.Rectangle[];
  private slotGlows!: Phaser.GameObjects.Rectangle[];
  private slotCooldownGfx!: Phaser.GameObjects.Graphics[];
  private slotNameTexts!: Phaser.GameObjects.Text[];
  private slotXs!: number[];
  private slotTopY!: number;

  // Interaction prompt
  private promptPanel!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;

  // Inventory hint
  private inventoryHint!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.buildHPPanel(scene);
    this.buildCoinPanel(scene);
    this.buildSlotPanels(scene);
    this.buildInteractPrompt(scene);
    this.buildInventoryHint(scene);
  }

  // ── HP panel (top-left) ────────────────────────────────────────

  private buildHPPanel(scene: Phaser.Scene) {
    const px = 8, py = 8, pw = 236, ph = 40;

    // Panel background
    const panelGfx = scene.add.graphics();
    panelGfx.fillStyle(PANEL_BG, 0.82);
    panelGfx.fillRect(px, py, pw, ph);
    panelGfx.lineStyle(1, PANEL_EDGE, 0.9);
    panelGfx.strokeRect(px, py, pw, ph);
    // Inner highlight line (top edge catches light)
    panelGfx.lineStyle(1, 0x3a4a6a, 0.4);
    panelGfx.strokeLineShape(new Phaser.Geom.Line(px + 1, py + 1, px + pw - 1, py + 1));

    // Heart icon (two circles + downward triangle)
    const heartGfx = scene.add.graphics();
    heartGfx.fillStyle(0xcc1111);
    heartGfx.fillCircle(22, 26, 5);
    heartGfx.fillCircle(28, 26, 5);
    heartGfx.fillTriangle(17, 28, 33, 28, 25, 36);
    heartGfx.fillStyle(0xff4444, 0.5);
    heartGfx.fillCircle(21, 24, 3);              // shine on heart

    // HP bar track
    const barX = 38, barY = 22, barW = 182, barH = 16;
    scene.add.rectangle(barX, barY, barW, barH, 0x220000, 0.9).setOrigin(0, 0);
    scene.add.rectangle(barX, barY, barW, barH, 0x000000, 0).setOrigin(0, 0)
      .setStrokeStyle(1, 0x440000, 0.9);

    // HP bar fill (two layers for gradient feel)
    this.hpBarFg = scene.add.rectangle(barX, barY, barW, barH, 0xcc1a1a).setOrigin(0, 0);
    this.hpBarFgShine = scene.add.rectangle(barX, barY, barW, 5, 0xee5555, 0.7).setOrigin(0, 0);

    // HP text
    this.hpText = scene.add.text(barX + barW - 2, barY + barH / 2, '100 / 100', {
      fontSize: '11px',
      color: '#ddcccc',
      fontFamily: 'monospace',
    }).setOrigin(1, 0.5);
  }

  // ── Coin panel (top-right) ─────────────────────────────────────

  private buildCoinPanel(scene: Phaser.Scene) {
    const pw = 108, ph = 40;
    const px = VW - pw - 8, py = 8;

    const panelGfx = scene.add.graphics();
    panelGfx.fillStyle(PANEL_BG, 0.82);
    panelGfx.fillRect(px, py, pw, ph);
    panelGfx.lineStyle(1, PANEL_EDGE, 0.9);
    panelGfx.strokeRect(px, py, pw, ph);
    panelGfx.lineStyle(1, 0x3a4a6a, 0.4);
    panelGfx.strokeLineShape(new Phaser.Geom.Line(px + 1, py + 1, px + pw - 1, py + 1));

    // Coin icon
    const cx = px + 18, cy = py + ph / 2;
    const coinGfx = scene.add.graphics();
    coinGfx.fillStyle(0x997700);
    coinGfx.fillCircle(cx, cy, 9);
    coinGfx.fillStyle(0xeeaa00);
    coinGfx.fillCircle(cx, cy, 7);
    coinGfx.fillStyle(0xffcc33, 0.8);
    coinGfx.fillEllipse(cx - 2, cy - 2, 8, 6);
    coinGfx.fillStyle(0xffffff, 0.85);
    coinGfx.fillCircle(cx - 3, cy - 3, 2);
    coinGfx.lineStyle(1, 0x775500, 0.8);
    coinGfx.strokeCircle(cx, cy, 9);

    // Coin count text
    this.coinText = scene.add.text(px + 32, py + ph / 2, '0', {
      fontSize: '15px',
      color: '#ffcc00',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);
  }

  // ── Weapon slot panels (bottom-center) ────────────────────────

  private buildSlotPanels(scene: Phaser.Scene) {
    const S = this.SLOT_SIZE;
    const gap = 10;
    const totalW = S * 2 + gap + 32; // extra for labels on the side
    const panelX = VW / 2 - totalW / 2 - 8;
    const panelY = VH - 90;
    const panelW = totalW + 16;
    const panelH = 82;

    // Outer panel
    const panelGfx = scene.add.graphics();
    panelGfx.fillStyle(PANEL_BG, 0.85);
    panelGfx.fillRect(panelX, panelY, panelW, panelH);
    panelGfx.lineStyle(1, PANEL_EDGE, 0.9);
    panelGfx.strokeRect(panelX, panelY, panelW, panelH);
    panelGfx.lineStyle(1, 0x3a4a6a, 0.35);
    panelGfx.strokeLineShape(new Phaser.Geom.Line(panelX + 1, panelY + 1, panelX + panelW - 1, panelY + 1));

    // Slot positions
    const slotCenterY = panelY + panelH / 2;
    const slot1X = VW / 2 - S - gap / 2;
    const slot2X = VW / 2 + gap / 2;
    this.slotXs = [slot1X, slot2X];
    this.slotTopY = slotCenterY - S / 2;

    this.slotBoxes = [];
    this.slotGlows = [];
    this.slotCooldownGfx = [];
    this.slotNameTexts = [];

    const labels = ['LMB', 'RMB'];

    for (let i = 0; i < 2; i++) {
      const sx = this.slotXs[i];

      // Glow halo behind the slot (tinted with rarity color when equipped)
      const glow = scene.add.rectangle(sx - 4, slotCenterY - S / 2 - 4, S + 8, S + 8, 0x000000, 0)
        .setOrigin(0, 0);
      this.slotGlows.push(glow);

      // Slot box background
      const box = scene.add.rectangle(sx, slotCenterY - S / 2, S, S, 0x060810, 0.92)
        .setOrigin(0, 0);
      box.setStrokeStyle(1.5, 0x333344, 1);
      this.slotBoxes.push(box);

      // Dark inner area (slightly lighter than box bg — creates depth)
      scene.add.rectangle(sx + 3, slotCenterY - S / 2 + 3, S - 6, S - 6, 0x0a0c18, 0.5)
        .setOrigin(0, 0);

      // Cooldown overlay Graphics (redrawn each frame)
      const cdGfx = scene.add.graphics();
      this.slotCooldownGfx.push(cdGfx);

      // Control label above slot
      scene.add.text(sx + S / 2, slotCenterY - S / 2 - 14, labels[i], {
        fontSize: '9px',
        color: '#4a5888',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);

      // Slot number/indicator
      scene.add.text(sx + 4, slotCenterY - S / 2 + 4, `${i + 1}`, {
        fontSize: '9px',
        color: '#333355',
        fontFamily: 'monospace',
      }).setOrigin(0, 0);

      // Weapon name + rarity text (below slot content area)
      const nameText = scene.add.text(sx + S / 2, slotCenterY + S / 2 + 6, 'Empty', {
        fontSize: '9px',
        color: '#444455',
        fontFamily: 'monospace',
        align: 'center',
      }).setOrigin(0.5, 0);
      this.slotNameTexts.push(nameText);
    }
  }

  // ── Interaction prompt ─────────────────────────────────────────

  private buildInteractPrompt(scene: Phaser.Scene) {
    const pw = 230, ph = 38;
    const px = VW / 2 - pw / 2;
    const py = VH - 140;

    this.promptPanel = scene.add.graphics();

    // Drawn in update() when toggling visibility — just set up the object.
    this.promptPanel.setVisible(false);

    this.promptText = scene.add.text(VW / 2, py + ph / 2, '[  E  ]  Open Chest', {
      fontSize: '13px',
      color: '#f0e080',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setVisible(false);

    // Pre-draw the panel geometry (it's static, just toggled visible).
    this.promptPanel.fillStyle(PANEL_BG, 0.92);
    this.promptPanel.fillRect(px, py, pw, ph);
    this.promptPanel.lineStyle(1.5, 0xccaa22, 0.9);
    this.promptPanel.strokeRect(px, py, pw, ph);
    this.promptPanel.lineStyle(1, 0xffee66, 0.25);
    this.promptPanel.strokeRect(px + 2, py + 2, pw - 4, ph - 4);
  }

  // ── Inventory hint (below slot panel) ─────────────────────────

  private buildInventoryHint(scene: Phaser.Scene) {
    this.inventoryHint = scene.add.text(VW / 2, VH - 6, '[I]  Inventory', {
      fontSize: '9px',
      color: '#2a3540',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 1);
  }

  // ── Per-frame update ───────────────────────────────────────────

  update(
    stats: PlayerStats,
    coins: number,
    slot1Data: SlotData,
    slot2Data: SlotData,
    showInteractPrompt: boolean,
    inventoryCount: number,
  ) {
    this.updateHP(stats);
    this.updateCoins(coins);
    this.updateSlot(0, slot1Data);
    this.updateSlot(1, slot2Data);
    this.promptPanel.setVisible(showInteractPrompt);
    this.promptText.setVisible(showInteractPrompt);
    this.inventoryHint.setColor(inventoryCount > 0 ? '#4a6688' : '#2a3540');
  }

  private updateHP(stats: PlayerStats) {
    const barW = 182;
    const frac = Math.max(0, Math.min(1, stats.hp / stats.maxHp));
    const fillW = Math.max(0, barW * frac);

    this.hpBarFg.setSize(fillW, 16);
    this.hpBarFgShine.setSize(fillW, 5);

    // Color shifts to orange/yellow at low HP.
    if (frac < 0.25) {
      this.hpBarFg.setFillStyle(0xee4400);
      this.hpBarFgShine.setFillStyle(0xff8844, 0.7);
    } else if (frac < 0.5) {
      this.hpBarFg.setFillStyle(0xcc2200);
      this.hpBarFgShine.setFillStyle(0xff5533, 0.7);
    } else {
      this.hpBarFg.setFillStyle(0xcc1a1a);
      this.hpBarFgShine.setFillStyle(0xee5555, 0.7);
    }

    this.hpText.setText(`${stats.hp} / ${stats.maxHp}`);
  }

  private updateCoins(coins: number) {
    this.coinText.setText(`${coins}`);
  }

  private updateSlot(index: 0 | 1, data: SlotData) {
    const S = this.SLOT_SIZE;
    const sx = this.slotXs[index];
    const sy = this.slotTopY;
    const box = this.slotBoxes[index];
    const glow = this.slotGlows[index];
    const cdGfx = this.slotCooldownGfx[index];
    const nameText = this.slotNameTexts[index];
    const colorHex = `#${data.rarityColor.toString(16).padStart(6, '0')}`;

    if (data.equipped) {
      box.setStrokeStyle(2, data.rarityColor, 1);
      glow.setFillStyle(data.rarityColor, 0.12);
      nameText.setText(`${data.weaponName}\n${data.rarity}`).setColor(colorHex);
    } else {
      box.setStrokeStyle(1.5, 0x333344, 1);
      glow.setFillStyle(0x000000, 0);
      nameText.setText('Empty').setColor('#333355');
    }

    // Cooldown overlay — redrawn from scratch each frame.
    cdGfx.clear();
    if (data.cooldownFraction > 0.02) {
      cdGfx.fillStyle(0x000000, 0.72);
      cdGfx.fillRect(sx, sy, S, S * data.cooldownFraction);

      // Cooldown fraction text at center of overlay
      // (handled via text object updated separately would need tracking; skip for now)
    }
  }

  /** Stub for future death/game-over screen integration. */
  showDeathScreen(_scene: Phaser.Scene) {
    // TODO: fade in dark overlay + "You Died" text
  }
}
