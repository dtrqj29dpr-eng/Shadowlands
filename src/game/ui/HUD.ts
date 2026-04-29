import Phaser from 'phaser';
import type { PlayerStats, SlotData, TooltipItemData, MinimapData } from '../types/GameTypes';
import { GAME_FONT_FAMILY } from '../config/FontConfig';
import { ItemTooltip } from './ItemTooltip';
import { LootFeed } from './LootFeed';
import { Minimap } from './Minimap';
import type { Weapon } from '../combat/Weapon';

// Shared dark-fantasy panel style.
const PANEL_BG   = 0x07080f;
const PANEL_EDGE = 0x2a3450;

export class HUD {
  // HP bar
  private hpBarFg!: Phaser.GameObjects.Rectangle;
  private hpBarFgShine!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;

  // Slots
  private readonly SLOT_SIZE = 56;
  private slotBoxes!: Phaser.GameObjects.Rectangle[];
  private slotGlows!: Phaser.GameObjects.Rectangle[];
  private slotCooldownGfx!: Phaser.GameObjects.Graphics[];
  private slotNameTexts!: Phaser.GameObjects.Text[];
  private slotSprites!: Phaser.GameObjects.Image[];
  private slotXs!: number[];
  private slotTopY!: number;

  // Interaction prompt
  private promptPanel!: Phaser.GameObjects.Graphics;
  private promptText!: Phaser.GameObjects.Text;

  // Tooltip
  private tooltip!: ItemTooltip;
  private slotTooltipData: [TooltipItemData | null, TooltipItemData | null] = [null, null];

  // Loot feed
  private lootFeed!: LootFeed;

  // Minimap
  private minimap!: Minimap;

  // All game objects created by this HUD (for cleanup on resize).
  private created: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.buildHPPanel(scene);
    this.buildSlotPanels(scene);
    this.buildInteractPrompt(scene);
    this.buildMinimap(scene);
    this.tooltip = new ItemTooltip(scene);
    this.lootFeed = new LootFeed(scene);
  }

  /** Track a game object for bulk cleanup in destroy(). */
  private t<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.created.push(o);
    return o;
  }

  showLootItem(weapon: Weapon) {
    this.lootFeed.showItem(weapon);
  }

  destroy() {
    this.created.forEach(o => o.destroy());
    this.created = [];
    this.tooltip.destroy();
    this.lootFeed.destroy();
    this.minimap.destroy();
  }

  // ── HP panel (bottom-center) ───────────────────────────────────

  private buildHPPanel(scene: Phaser.Scene) {
    const vw = scene.scale.width;
    const vh = scene.scale.height;
    const pw = 236, ph = 40;
    const px = Math.round(vw / 2 - pw / 2);
    const py = vh - ph - 8;

    const panelGfx = this.t(scene.add.graphics());
    panelGfx.fillStyle(PANEL_BG, 0.82);
    panelGfx.fillRect(px, py, pw, ph);
    panelGfx.lineStyle(1, PANEL_EDGE, 0.9);
    panelGfx.strokeRect(px, py, pw, ph);
    panelGfx.lineStyle(1, 0x3a4a6a, 0.4);
    panelGfx.strokeLineShape(new Phaser.Geom.Line(px + 1, py + 1, px + pw - 1, py + 1));

    // Heart icon (positions relative to panel origin)
    const heartGfx = this.t(scene.add.graphics());
    heartGfx.fillStyle(0xcc1111);
    heartGfx.fillCircle(px + 14, py + 18, 5);
    heartGfx.fillCircle(px + 20, py + 18, 5);
    heartGfx.fillTriangle(px + 9, py + 20, px + 25, py + 20, px + 17, py + 28);
    heartGfx.fillStyle(0xff4444, 0.5);
    heartGfx.fillCircle(px + 13, py + 16, 3);

    const barX = px + 30, barY = py + 12, barW = 182, barH = 16;
    this.t(scene.add.rectangle(barX, barY, barW, barH, 0x220000, 0.9).setOrigin(0, 0));
    this.t(scene.add.rectangle(barX, barY, barW, barH, 0x000000, 0).setOrigin(0, 0)
      .setStrokeStyle(1, 0x440000, 0.9));

    this.hpBarFg = this.t(scene.add.rectangle(barX, barY, barW, barH, 0xcc1a1a).setOrigin(0, 0));
    this.hpBarFgShine = this.t(scene.add.rectangle(barX, barY, barW, 5, 0xee5555, 0.7).setOrigin(0, 0));

    this.hpText = this.t(scene.add.text(barX + barW - 2, barY + barH / 2, '100 / 100', {
      fontSize: '11px',
      color: '#ddcccc',
      fontFamily: GAME_FONT_FAMILY,
    }).setOrigin(1, 0.5));
  }

  // ── Weapon slot panels (bottom-center) ────────────────────────

  private buildSlotPanels(scene: Phaser.Scene) {
    const vw = scene.scale.width;
    const vh = scene.scale.height;
    const S = this.SLOT_SIZE;
    const gap = 10;
    const totalW = S * 2 + gap + 32; // extra for labels on the side
    const panelX = vw / 2 - totalW / 2 - 8;
    const panelY = vh - 160;
    const panelW = totalW + 16;
    const panelH = 82;

    // Outer panel
    const panelGfx = this.t(scene.add.graphics());
    panelGfx.fillStyle(PANEL_BG, 0.85);
    panelGfx.fillRect(panelX, panelY, panelW, panelH);
    panelGfx.lineStyle(1, PANEL_EDGE, 0.9);
    panelGfx.strokeRect(panelX, panelY, panelW, panelH);
    panelGfx.lineStyle(1, 0x3a4a6a, 0.35);
    panelGfx.strokeLineShape(new Phaser.Geom.Line(panelX + 1, panelY + 1, panelX + panelW - 1, panelY + 1));

    // Slot positions
    const slotCenterY = panelY + panelH / 2;
    const slot1X = vw / 2 - S - gap / 2;
    const slot2X = vw / 2 + gap / 2;
    this.slotXs = [slot1X, slot2X];
    this.slotTopY = slotCenterY - S / 2;

    this.slotBoxes = [];
    this.slotGlows = [];
    this.slotCooldownGfx = [];
    this.slotNameTexts = [];
    this.slotSprites = [];

    for (let i = 0; i < 2; i++) {
      const sx = this.slotXs[i];

      // Glow halo behind the slot (tinted with rarity color when equipped)
      const glow = this.t(scene.add.rectangle(sx - 4, slotCenterY - S / 2 - 4, S + 8, S + 8, 0x000000, 0)
        .setOrigin(0, 0));
      this.slotGlows.push(glow);

      // Slot box background
      const box = this.t(scene.add.rectangle(sx, slotCenterY - S / 2, S, S, 0x060810, 0.92)
        .setOrigin(0, 0));
      box.setStrokeStyle(1.5, 0x333344, 1);
      this.slotBoxes.push(box);

      // Dark inner area (slightly lighter than box bg — creates depth)
      this.t(scene.add.rectangle(sx + 3, slotCenterY - S / 2 + 3, S - 6, S - 6, 0x0a0c18, 0.5)
        .setOrigin(0, 0));

      // Weapon sprite icon — hidden until a weapon is equipped.
      const sprite = this.t(scene.add.image(sx + S / 2, slotCenterY, 'sword-projectile')
        .setScale(1.5)
        .setRotation(-Math.PI / 4)
        .setAlpha(0.92)
        .setVisible(false));
      this.slotSprites.push(sprite);

      // Cooldown overlay Graphics (redrawn each frame)
      const cdGfx = this.t(scene.add.graphics());
      this.slotCooldownGfx.push(cdGfx);

      // Slot number/indicator
      this.t(scene.add.text(sx + 4, slotCenterY - S / 2 + 4, `${i + 1}`, {
        fontSize: '9px',
        color: '#333355',
        fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0, 0));

      // Weapon name + rarity text (below slot content area)
      const nameText = this.t(scene.add.text(sx + S / 2, slotCenterY + S / 2 + 6, 'Empty', {
        fontSize: '9px',
        color: '#444455',
        fontFamily: GAME_FONT_FAMILY,
        align: 'center',
      }).setOrigin(0.5, 0));
      this.slotNameTexts.push(nameText);

      // Hoverable zone for tooltip — captures the slot index via closure
      const slotIdx = i;
      const zone = this.t(scene.add
        .zone(sx, slotCenterY - S / 2, S, S)
        .setOrigin(0, 0)
        .setInteractive(
          new Phaser.Geom.Rectangle(0, 0, S, S),
          Phaser.Geom.Rectangle.Contains,
        ));

      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        if (scene.scene.isActive('InventoryScene')) return;
        const data = this.slotTooltipData[slotIdx];
        if (data) this.tooltip.show(data, pointer.x, pointer.y);
      });
      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (scene.scene.isActive('InventoryScene')) return;
        this.tooltip.moveTo(pointer.x, pointer.y);
      });
      zone.on('pointerout', () => {
        this.tooltip.hide();
      });
    }
  }

  // ── Interaction prompt ─────────────────────────────────────────

  private buildInteractPrompt(scene: Phaser.Scene) {
    const vw = scene.scale.width;
    const vh = scene.scale.height;
    const pw = 230, ph = 38;
    const px = vw / 2 - pw / 2;
    const py = vh - 230;

    this.promptPanel = this.t(scene.add.graphics());

    // Drawn in update() when toggling visibility — just set up the object.
    this.promptPanel.setVisible(false);

    this.promptText = this.t(scene.add.text(vw / 2, py + ph / 2, 'Open Chest', {
      fontSize: '13px',
      color: '#f0e080',
      fontFamily: GAME_FONT_FAMILY,
    }).setOrigin(0.5, 0.5).setVisible(false));

    // Pre-draw the panel geometry (it's static, just toggled visible).
    this.promptPanel.fillStyle(PANEL_BG, 0.92);
    this.promptPanel.fillRect(px, py, pw, ph);
    this.promptPanel.lineStyle(1.5, 0xccaa22, 0.9);
    this.promptPanel.strokeRect(px, py, pw, ph);
    this.promptPanel.lineStyle(1, 0xffee66, 0.25);
    this.promptPanel.strokeRect(px + 2, py + 2, pw - 4, ph - 4);
  }

  // ── Minimap ────────────────────────────────────────────────────

  private buildMinimap(scene: Phaser.Scene) {
    const vw = scene.scale.width;
    const SIZE = 120, MARGIN = 8;
    this.minimap = new Minimap(scene, vw - SIZE - MARGIN, MARGIN, SIZE);
  }

  // ── Per-frame update ───────────────────────────────────────────

  update(
    stats: PlayerStats,
    slot1Data: SlotData,
    slot2Data: SlotData,
    showInteractPrompt: boolean,
    slot1Tooltip: TooltipItemData | null,
    slot2Tooltip: TooltipItemData | null,
    minimapData: MinimapData,
  ) {
    this.updateHP(stats);
    this.updateSlot(0, slot1Data);
    this.updateSlot(1, slot2Data);
    this.promptPanel.setVisible(showInteractPrompt);
    this.promptText.setVisible(showInteractPrompt);
    this.slotTooltipData[0] = slot1Tooltip;
    this.slotTooltipData[1] = slot2Tooltip;
    // Hide tooltip if the weapon was unequipped while hovered.
    if (!slot1Tooltip && !slot2Tooltip) this.tooltip.hide();
    this.minimap.update(minimapData);
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
      this.slotSprites[index].setTexture(data.weaponTextureKey ?? 'sword-projectile').setVisible(true);
    } else {
      box.setStrokeStyle(1.5, 0x333344, 1);
      glow.setFillStyle(0x000000, 0);
      nameText.setText('Empty').setColor('#333355');
      this.slotSprites[index].setVisible(false);
    }

    // Cooldown overlay — redrawn from scratch each frame.
    cdGfx.clear();
    if (data.cooldownFraction > 0.02) {
      cdGfx.fillStyle(0x000000, 0.72);
      cdGfx.fillRect(sx, sy, S, S * data.cooldownFraction);
    }
  }

  /** Stub for future death/game-over screen integration. */
  showDeathScreen(_scene: Phaser.Scene) {
    // TODO: fade in dark overlay + "You Died" text
  }
}
