import Phaser from 'phaser';
import type { InventorySystem } from '../systems/InventorySystem';
import type { ArtifactInventory } from '../systems/ArtifactInventory';
import type { Player } from '../entities/Player';
import type { Weapon } from '../combat/Weapon';
import type { Artifact } from '../combat/Artifact';
import type { ItemCategory } from '../types/GameTypes';
import { ItemTooltip } from '../ui/ItemTooltip';
import { GAME_FONT_FAMILY } from '../config/FontConfig';

// ── Pure geometry helper ──────────────────────────────────────────────────────

function slotRingPositions(
  count: number, cx: number, cy: number, radius: number,
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

// ── Style constants ───────────────────────────────────────────────────────────

const CARD_W = 90;
const CARD_H = 68;
const CARD_GAP = 8;
const COLS = 4;
const PANEL_X = 20;
const PANEL_Y = 22;
const PANEL_BG = 0x07080f;
const PANEL_EDGE = 0x2a3450;
const WEAPON_OFFSET = 110;
const WEAPON_SLOT_SIZE = 60;
const ARTIFACT_RADIUS = 110;
const ARTIFACT_SLOT_SIZE = 54;

// ── Shared item shape ─────────────────────────────────────────────────────────

type EquippableItem = Weapon | Artifact;

// ── Scene ─────────────────────────────────────────────────────────────────────

export class InventoryScene extends Phaser.Scene {
  private inventorySystem!: InventorySystem;
  private artifactInventory!: ArtifactInventory;
  private player!: Player;

  private activeTab: ItemCategory = 'weapons';
  private selectedIndex = -1;

  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private iKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private tooltip!: ItemTooltip;

  // Layout values computed in create(), reused in build methods.
  private charX = 0;
  private charY = 0;
  private dividerX = 0;
  private gridX = 0;
  private gridY = 0;
  private tabY = 0;
  private leftCenterX = 0;
  private pX = 0;
  private pY = 0;
  private pW = 0;
  private pH = 0;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { inventorySystem: InventorySystem; artifactInventory: ArtifactInventory; player: Player }) {
    this.inventorySystem = data.inventorySystem;
    this.artifactInventory = data.artifactInventory;
    this.player = data.player;
    this.selectedIndex = -1;
    // activeTab is intentionally NOT reset here — preserved across scene.restart() (resize).
  }

  create() {
    const VW = this.scale.width;
    const VH = this.scale.height;
    const PW = VW - PANEL_X * 2;
    const PH = VH - 46;
    const HALF_W = Math.floor(PW / 2);
    const DX = PANEL_X + HALF_W;

    this.pX = PANEL_X;
    this.pY = PANEL_Y;
    this.pW = PW;
    this.pH = PH;
    this.dividerX = DX;
    this.leftCenterX = PANEL_X + HALF_W / 2;
    this.charX = this.leftCenterX;
    this.charY = PANEL_Y + Math.floor(PH * 0.40);
    this.gridX = DX + 14;
    this.gridY = PANEL_Y + 58;
    this.tabY = PANEL_Y + PH - 52;

    // ── Static chrome ──────────────────────────────────────────────
    this.add.rectangle(0, 0, VW, VH, 0x000000, 0.75).setOrigin(0, 0);

    const chrome = this.add.graphics();
    chrome.fillStyle(PANEL_BG, 0.97);
    chrome.fillRect(PANEL_X, PANEL_Y, PW, PH);
    chrome.lineStyle(1.5, PANEL_EDGE, 1);
    chrome.strokeRect(PANEL_X, PANEL_Y, PW, PH);
    // Header separator
    chrome.lineStyle(1, PANEL_EDGE, 0.55);
    chrome.strokeLineShape(new Phaser.Geom.Line(PANEL_X, PANEL_Y + 34, PANEL_X + PW, PANEL_Y + 34));
    // Vertical divider
    chrome.strokeLineShape(new Phaser.Geom.Line(DX, PANEL_Y + 34, DX, PANEL_Y + PH));
    // Tab area divider
    chrome.strokeLineShape(new Phaser.Geom.Line(PANEL_X, this.tabY - 14, DX, this.tabY - 14));

    this.add.text(PANEL_X + PW / 2, PANEL_Y + 17, 'INVENTORY', {
      fontSize: '16px', color: '#aabbdd', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.key1 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);

    this.tooltip = new ItemTooltip(this);
    this.rebuildDisplay();

    this.scale.on('resize', () => {
      if (!this.scene.isActive()) return;
      this.scene.restart();
    }, this);
    this.events.once('shutdown', () => this.scale.off('resize', undefined, this));
  }

  update() {
    if (
      Phaser.Input.Keyboard.JustDown(this.iKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.scene.resume('GameScene');
      this.scene.stop();
    }

    if (this.activeTab === 'weapons' && this.selectedIndex >= 0) {
      if (Phaser.Input.Keyboard.JustDown(this.key1)) this.equipWeaponToSlot(1);
      else if (Phaser.Input.Keyboard.JustDown(this.key2)) this.equipWeaponToSlot(2);
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  private setTab(tab: ItemCategory) {
    this.activeTab = tab;
    this.selectedIndex = -1;
    this.rebuildDisplay();
  }

  // ── Rebuild ───────────────────────────────────────────────────────────────

  private rebuildDisplay() {
    this.tooltip?.hide();
    for (const obj of this.dynamicObjects) obj.destroy();
    this.dynamicObjects = [];
    this.buildTabSwitcher();
    this.buildCharacterPanel();
    this.buildStatsPanel();
    this.buildItemGrid();
  }

  // ── Tab switcher ──────────────────────────────────────────────────────────

  private buildTabSwitcher() {
    const btnW = 130, btnH = 36, gap = 10;
    const totalW = btnW * 2 + gap;
    const startX = this.leftCenterX - totalW / 2;
    const ty = this.tabY;

    const tabs: Array<{ label: string; tab: ItemCategory }> = [
      { label: 'Weapons',   tab: 'weapons' },
      { label: 'Artifacts', tab: 'artifacts' },
    ];

    tabs.forEach(({ label, tab }, i) => {
      const bx = startX + i * (btnW + gap);
      const active = this.activeTab === tab;

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawTabBtn(gfx, bx, ty, btnW, btnH, active, false);

      const txt = this.add.text(bx + btnW / 2, ty + btnH / 2, label, {
        fontSize: '11px',
        color: active ? '#aaccff' : '#445566',
        fontFamily: GAME_FONT_FAMILY,
        fontStyle: active ? 'bold' : 'normal',
      }).setOrigin(0.5, 0.5);
      this.dynamicObjects.push(txt);

      const capturedTab = tab;
      const zone = this.add.zone(bx, ty, btnW, btnH)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerup', () => {
        if (this.activeTab !== capturedTab) this.setTab(capturedTab);
      });
      zone.on('pointerover', () => {
        if (!active) { gfx.clear(); this.drawTabBtn(gfx, bx, ty, btnW, btnH, false, true); }
      });
      zone.on('pointerout', () => {
        if (!active) { gfx.clear(); this.drawTabBtn(gfx, bx, ty, btnW, btnH, false, false); }
      });
      this.dynamicObjects.push(zone);
    });
  }

  private drawTabBtn(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    active: boolean, hover: boolean,
  ) {
    gfx.fillStyle(active ? 0x141e30 : (hover ? 0x0d1020 : 0x090b17), 1);
    gfx.fillRect(x, y, w, h);
    gfx.lineStyle(1.5, active ? 0x5588cc : (hover ? 0x3a4a6a : 0x2a3450), 1);
    gfx.strokeRect(x, y, w, h);
  }

  // ── Left panel: character + equip slots ───────────────────────────────────

  private buildCharacterPanel() {
    const { charX, charY } = this;

    const sectionLabel = this.add.text(this.pX + 14, this.pY + 52, 'EQUIPMENT', {
      fontSize: '10px', color: '#55667a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0, 1);
    this.dynamicObjects.push(sectionLabel);

    // Character glow
    const glowGfx = this.add.graphics();
    glowGfx.fillStyle(0x151c30, 0.85);
    glowGfx.fillCircle(charX, charY, 54);
    glowGfx.lineStyle(1, 0x2a3450, 0.6);
    glowGfx.strokeCircle(charX, charY, 54);
    this.dynamicObjects.push(glowGfx);

    // Character sprite
    const sprite = this.add.image(charX, charY, 'player')
      .setScale(2.5)
      .setOrigin(0.5)
      .setAlpha(0.88);
    this.dynamicObjects.push(sprite);

    if (this.activeTab === 'weapons') {
      this.buildWeaponSlots();
    } else {
      this.buildArtifactSlots();
    }
  }

  private buildWeaponSlots() {
    const { charX, charY } = this;
    const targetable = this.selectedIndex >= 0;
    const S = WEAPON_SLOT_SIZE;

    const positions = [
      { x: charX - WEAPON_OFFSET, y: charY },
      { x: charX + WEAPON_OFFSET, y: charY },
    ];
    const slotNums: Array<1 | 2> = [1, 2];

    for (let i = 0; i < 2; i++) {
      const { x: cx, y: cy } = positions[i];
      const slotNum = slotNums[i];
      const weapon = this.player.getEquippedWeapon(slotNum);

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawEquipSlot(gfx, cx, cy, S, weapon, false, targetable, false);

      const numLabel = this.add.text(cx - S / 2 + 4, cy - S / 2 + 4, `${slotNum}`, {
        fontSize: '8px', color: '#333355', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0, 0);
      this.dynamicObjects.push(numLabel);

      if (weapon) {
        const wSprite = this.add.image(cx, cy - 4, weapon.textureKey)
          .setScale(1.6)
          .setRotation(-Math.PI / 4)
          .setAlpha(0.9);
        this.dynamicObjects.push(wSprite);

        const colorHex = `#${weapon.rarityColor.toString(16).padStart(6, '0')}`;
        const nameTxt = this.add.text(cx, cy + S / 2 + 7, weapon.displayName, {
          fontSize: '9px', color: colorHex, fontFamily: GAME_FONT_FAMILY,
          align: 'center', wordWrap: { width: S + 24 },
        }).setOrigin(0.5, 0);
        this.dynamicObjects.push(nameTxt);
      } else if (targetable) {
        const hint = this.add.text(cx, cy, '→', {
          fontSize: '16px', color: '#2a4060', fontFamily: GAME_FONT_FAMILY,
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(hint);
      }

      const sn = slotNum;
      const capWeapon = weapon;
      const zone = this.add.zone(cx - S / 2, cy - S / 2, S, S)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerup', () => {
        if (this.selectedIndex >= 0) this.equipWeaponToSlot(sn);
      });
      zone.on('pointerover', (ptr: Phaser.Input.Pointer) => {
        gfx.clear();
        this.drawEquipSlot(gfx, cx, cy, S, capWeapon, true, targetable, false);
        if (capWeapon && !targetable) this.tooltip.show(capWeapon.getInventoryTooltipData(), ptr.x, ptr.y);
      });
      zone.on('pointermove', (ptr: Phaser.Input.Pointer) => this.tooltip.moveTo(ptr.x, ptr.y));
      zone.on('pointerout', () => {
        gfx.clear();
        this.drawEquipSlot(gfx, cx, cy, S, capWeapon, false, targetable, false);
        this.tooltip.hide();
      });
      this.dynamicObjects.push(zone);
    }
  }

  private buildArtifactSlots() {
    const { charX, charY } = this;
    const count = this.player.getUnlockedArtifactSlotCount();
    const positions = slotRingPositions(count, charX, charY, ARTIFACT_RADIUS);
    const targetable = this.selectedIndex >= 0;
    const S = ARTIFACT_SLOT_SIZE;

    for (let i = 0; i < count; i++) {
      const { x: cx, y: cy } = positions[i];
      const artifact = this.player.getEquippedArtifact(i);

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawEquipSlot(gfx, cx, cy, S, artifact, false, targetable, true);

      const numLabel = this.add.text(cx - S / 2 + 4, cy - S / 2 + 4, `${i + 1}`, {
        fontSize: '8px', color: '#3a2255', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0, 0);
      this.dynamicObjects.push(numLabel);

      if (artifact) {
        const aSprite = this.add.image(cx, cy - 2, artifact.textureKey)
          .setScale(1.2)
          .setAlpha(0.9);
        this.dynamicObjects.push(aSprite);

        const colorHex = `#${artifact.rarityColor.toString(16).padStart(6, '0')}`;
        const nameTxt = this.add.text(cx, cy + S / 2 + 7, artifact.displayName, {
          fontSize: '9px', color: colorHex, fontFamily: GAME_FONT_FAMILY,
          align: 'center', wordWrap: { width: S + 24 },
        }).setOrigin(0.5, 0);
        this.dynamicObjects.push(nameTxt);
      } else if (targetable) {
        const hint = this.add.text(cx, cy, '→', {
          fontSize: '14px', color: '#2a1f40', fontFamily: GAME_FONT_FAMILY,
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(hint);
      }

      const capI = i;
      const capArtifact = artifact;
      const zone = this.add.zone(cx - S / 2, cy - S / 2, S, S)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerup', () => {
        if (this.selectedIndex >= 0) this.equipArtifactToSlot(capI);
      });
      zone.on('pointerover', (ptr: Phaser.Input.Pointer) => {
        gfx.clear();
        this.drawEquipSlot(gfx, cx, cy, S, capArtifact, true, targetable, true);
        if (capArtifact && !targetable) this.tooltip.show(capArtifact.getInventoryTooltipData(), ptr.x, ptr.y);
      });
      zone.on('pointermove', (ptr: Phaser.Input.Pointer) => this.tooltip.moveTo(ptr.x, ptr.y));
      zone.on('pointerout', () => {
        gfx.clear();
        this.drawEquipSlot(gfx, cx, cy, S, capArtifact, false, targetable, true);
        this.tooltip.hide();
      });
      this.dynamicObjects.push(zone);
    }
  }

  private drawEquipSlot(
    gfx: Phaser.GameObjects.Graphics,
    cx: number, cy: number, size: number,
    item: EquippableItem | null,
    hover: boolean, targetable: boolean, isArtifact: boolean,
  ) {
    const x = cx - size / 2, y = cy - size / 2;
    gfx.fillStyle(hover ? 0x0f1220 : 0x090b17, 0.95);
    gfx.fillRect(x, y, size, size);

    if (targetable && !item) {
      gfx.lineStyle(2, hover ? 0x7799cc : 0x2a4060, 1);
    } else if (item) {
      gfx.lineStyle(2, item.rarityColor, hover ? 1 : 0.85);
    } else {
      gfx.lineStyle(1.5, isArtifact ? 0x2a1f40 : 0x333344, 1);
    }
    gfx.strokeRect(x, y, size, size);
  }

  // ── Left panel: stats summary ─────────────────────────────────────────────

  private buildStatsPanel() {
    const stats = this.player.getEffectiveStats();

    const PNL_X = this.pX + 8;
    const PNL_W = 156;
    const TITLE_H = 14;
    const SEP_H = 1;
    const ROW_H = 14;
    const BOTTOM_PAD = 5;
    const startY = this.pY + 58;

    const rows: Array<{ label: string; value: string }> = [
      { label: 'HP',       value: `${stats.maxHp}` },
      { label: 'Speed',    value: `${stats.speed}%` },
      { label: 'Strength', value: `+${stats.strength}%` },
      { label: 'Crit',     value: `${stats.critChance}%` },
      { label: 'Crit DMG', value: `+${stats.critDamage}%` },
    ];

    const maxH = this.charY - 62 - startY;
    if (maxH < TITLE_H + SEP_H + ROW_H + BOTTOM_PAD) return;
    const rowCount = Math.min(rows.length, Math.floor((maxH - TITLE_H - SEP_H - BOTTOM_PAD) / ROW_H));
    const PNL_H = TITLE_H + SEP_H + rowCount * ROW_H + BOTTOM_PAD;

    const gfx = this.add.graphics();
    gfx.fillStyle(0x080a12, 1);
    gfx.fillRect(PNL_X, startY, PNL_W, PNL_H);
    gfx.lineStyle(1, 0x1a2436, 1);
    gfx.strokeRect(PNL_X, startY, PNL_W, PNL_H);
    gfx.lineStyle(1, 0x1e2a3e, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(PNL_X + 6, startY + TITLE_H, PNL_X + PNL_W - 6, startY + TITLE_H));
    this.dynamicObjects.push(gfx);

    const titleTxt = this.add.text(PNL_X + PNL_W / 2, startY + TITLE_H / 2, 'STATS', {
      fontSize: '9px', color: '#55667a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.dynamicObjects.push(titleTxt);

    for (let i = 0; i < rowCount; i++) {
      const { label, value } = rows[i];
      const rowY = startY + TITLE_H + SEP_H + i * ROW_H + ROW_H / 2;

      const lbl = this.add.text(PNL_X + 8, rowY, label, {
        fontSize: '9px', color: '#667788', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0, 0.5);
      this.dynamicObjects.push(lbl);

      const val = this.add.text(PNL_X + PNL_W - 8, rowY, value, {
        fontSize: '9px', color: '#ddeeff', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(1, 0.5);
      this.dynamicObjects.push(val);
    }
  }

  // ── Right panel: item grid ────────────────────────────────────────────────

  private buildItemGrid() {
    const label = this.activeTab === 'weapons' ? 'WEAPONS' : 'ARTIFACTS';
    const sectionLabel = this.add.text(this.gridX, this.pY + 52, label, {
      fontSize: '10px', color: '#55667a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0, 1);
    this.dynamicObjects.push(sectionLabel);

    const items: (EquippableItem | null)[] = this.activeTab === 'weapons'
      ? this.inventorySystem.getAll()
      : this.artifactInventory.getAll().slice(0, 12);

    const count = Math.min(items.length, 12);

    for (let i = 0; i < count; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = this.gridX + col * (CARD_W + CARD_GAP);
      const cy = this.gridY + row * (CARD_H + CARD_GAP);
      const item = items[i] ?? null;
      const selected = this.selectedIndex === i;

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawGridCard(gfx, cx, cy, item, selected, false);

      if (item) {
        const colorHex = `#${item.rarityColor.toString(16).padStart(6, '0')}`;

        const iSprite = this.add.image(cx + CARD_W / 2, cy + 22, item.textureKey)
          .setScale(1.5)
          .setRotation(-Math.PI / 4)
          .setAlpha(0.92);
        this.dynamicObjects.push(iSprite);

        const nameTxt = this.add.text(cx + CARD_W / 2, cy + 47, item.displayName, {
          fontSize: '9px', color: '#ccdde8', fontFamily: GAME_FONT_FAMILY,
          align: 'center', wordWrap: { width: CARD_W - 8 },
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(nameTxt);

        const rarityTxt = this.add.text(cx + CARD_W / 2, cy + 59, item.rarity, {
          fontSize: '8px', color: colorHex, fontFamily: GAME_FONT_FAMILY,
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(rarityTxt);

        const capI = i;
        const capItem = item;
        const zone = this.add.zone(cx, cy, CARD_W, CARD_H)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });

        zone.on('pointerup', () => {
          this.selectedIndex = this.selectedIndex === capI ? -1 : capI;
          this.rebuildDisplay();
        });
        zone.on('pointerover', (ptr: Phaser.Input.Pointer) => {
          if (!selected) { gfx.clear(); this.drawGridCard(gfx, cx, cy, capItem, false, true); }
          this.tooltip.show(capItem.getInventoryTooltipData(), ptr.x, ptr.y);
        });
        zone.on('pointermove', (ptr: Phaser.Input.Pointer) => this.tooltip.moveTo(ptr.x, ptr.y));
        zone.on('pointerout', () => {
          if (!selected) { gfx.clear(); this.drawGridCard(gfx, cx, cy, capItem, false, false); }
          this.tooltip.hide();
        });
        this.dynamicObjects.push(zone);
      }
    }
  }

  private drawGridCard(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number,
    item: EquippableItem | null,
    selected: boolean, hover: boolean,
  ) {
    if (selected) {
      gfx.fillStyle(0x141830, 1);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(2, 0x88aaff, 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    } else if (hover && item) {
      gfx.fillStyle(0x121526, 1);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(2, item.rarityColor, 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    } else {
      gfx.fillStyle(0x090b17, 0.9);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(item ? 1.5 : 1, item ? item.rarityColor : 0x1a1a2a, item ? 0.75 : 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    }
  }

  // ── Equip logic ───────────────────────────────────────────────────────────

  private equipWeaponToSlot(slotNum: 1 | 2) {
    const weapon = this.inventorySystem.getAll()[this.selectedIndex] as Weapon | null;
    if (!weapon) return;

    const existing = this.player.getEquippedWeapon(slotNum);
    if (existing) this.inventorySystem.addWeapon(existing);

    this.inventorySystem.removeAt(this.selectedIndex);
    this.player.equipWeapon(weapon, slotNum);
    this.selectedIndex = -1;
    this.rebuildDisplay();
  }

  private equipArtifactToSlot(slotIndex: number) {
    const artifact = this.artifactInventory.getAll()[this.selectedIndex] as Artifact | null;
    if (!artifact) return;

    const existing = this.player.getEquippedArtifact(slotIndex);
    if (existing) this.artifactInventory.add(existing);

    this.artifactInventory.removeAt(this.selectedIndex);
    this.player.equipArtifact(artifact, slotIndex);
    this.selectedIndex = -1;
    this.rebuildDisplay();
  }
}
