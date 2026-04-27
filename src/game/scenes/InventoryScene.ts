import Phaser from 'phaser';
import type { InventorySystem } from '../systems/InventorySystem';
import type { Player } from '../entities/Player';
import type { Weapon } from '../combat/Weapon';
import { ItemTooltip } from '../ui/ItemTooltip';

const VW = 800;
const VH = 600;

const CARD_W = 90;
const CARD_H = 68;
const CARD_GAP = 8;
const COLS = 4;

const PANEL_X = 20;
const PANEL_Y = 22;
const PANEL_W = 760;
const PANEL_H = 554;

const DIVIDER_X = PANEL_X + 296;
const LEFT_X = PANEL_X + 14;
const RIGHT_X = DIVIDER_X + 14;
const CONTENT_Y = PANEL_Y + 58;

const PANEL_BG = 0x07080f;
const PANEL_EDGE = 0x2a3450;

export class InventoryScene extends Phaser.Scene {
  private inventorySystem!: InventorySystem;
  private player!: Player;
  private selectedIndex = -1;
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private iKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private tooltip!: ItemTooltip;

  constructor() {
    super({ key: 'InventoryScene' });
  }

  init(data: { inventorySystem: InventorySystem; player: Player }) {
    this.inventorySystem = data.inventorySystem;
    this.player = data.player;
    this.selectedIndex = -1;
  }

  create() {
    // Full-canvas dim overlay
    this.add.rectangle(0, 0, VW, VH, 0x000000, 0.75).setOrigin(0, 0);

    // Static chrome: panel + dividers
    const chrome = this.add.graphics();
    chrome.fillStyle(PANEL_BG, 0.97);
    chrome.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    chrome.lineStyle(1.5, PANEL_EDGE, 1);
    chrome.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    chrome.lineStyle(1, PANEL_EDGE, 0.55);
    // Header separator
    chrome.strokeLineShape(
      new Phaser.Geom.Line(PANEL_X, PANEL_Y + 34, PANEL_X + PANEL_W, PANEL_Y + 34),
    );
    // Left / right separator
    chrome.strokeLineShape(
      new Phaser.Geom.Line(DIVIDER_X, PANEL_Y + 34, DIVIDER_X, PANEL_Y + PANEL_H),
    );

    this.add.text(PANEL_X + 14, PANEL_Y + 17, 'INVENTORY', {
      fontSize: '16px', color: '#aabbdd', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(PANEL_X + PANEL_W - 14, PANEL_Y + 17, '[I] or [Esc]  Close', {
      fontSize: '10px', color: '#44566a', fontFamily: 'monospace',
    }).setOrigin(1, 0.5);

    this.add.text(LEFT_X, CONTENT_Y - 12, 'EQUIPPED', {
      fontSize: '10px', color: '#55667a', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 1);

    this.add.text(RIGHT_X, CONTENT_Y - 12, 'COLLECTED', {
      fontSize: '10px', color: '#55667a', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 1);

    this.iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.tooltip = new ItemTooltip(this);
    this.rebuildDisplay();
  }

  update() {
    if (
      Phaser.Input.Keyboard.JustDown(this.iKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.closeInventory();
    }
  }

  private closeInventory() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  private rebuildDisplay() {
    this.tooltip?.hide();
    for (const obj of this.dynamicObjects) obj.destroy();
    this.dynamicObjects = [];
    this.buildEquippedPanel();
    this.buildInventoryGrid();
  }

  // ── Left panel: equipped slots ──────────────────────────────────

  private buildEquippedPanel() {
    const cardW = 254;
    const cardH = 100;
    const cardX = LEFT_X;
    const targetable = this.selectedIndex >= 0;

    const slots: Array<{ slotNum: 1 | 2; binding: string }> = [
      { slotNum: 1, binding: 'SLOT 1  —  LMB' },
      { slotNum: 2, binding: 'SLOT 2  —  RMB' },
    ];

    for (let i = 0; i < 2; i++) {
      const { slotNum, binding } = slots[i];
      const cardY = CONTENT_Y + i * (cardH + 24);
      const weapon = this.player.getEquippedWeapon(slotNum);

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawEquipCard(gfx, cardX, cardY, cardW, cardH, weapon, false, targetable);

      const bindLabel = this.add.text(cardX + 6, cardY + 7, binding, {
        fontSize: '9px', color: '#3d4f5f', fontFamily: 'monospace',
      }).setOrigin(0, 0);
      this.dynamicObjects.push(bindLabel);

      if (weapon) {
        const colorHex = `#${weapon.rarityColor.toString(16).padStart(6, '0')}`;

        const weaponSprite = this.add.image(cardX + cardW / 2, cardY + 32, weapon.textureKey)
          .setScale(2.0)
          .setRotation(-Math.PI / 4)
          .setAlpha(0.92);
        this.dynamicObjects.push(weaponSprite);

        const nameText = this.add.text(cardX + cardW / 2, cardY + 67, weapon.displayName, {
          fontSize: '13px', color: '#ddeeff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(nameText);

        const rarityText = this.add.text(cardX + cardW / 2, cardY + 82, weapon.rarity, {
          fontSize: '10px', color: colorHex, fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(rarityText);

        if (targetable) {
          const hint = this.add.text(cardX + cardW / 2, cardY + cardH - 7, '→ equip here', {
            fontSize: '9px', color: '#4466aa', fontFamily: 'monospace',
          }).setOrigin(0.5, 1);
          this.dynamicObjects.push(hint);
        }
      } else {
        const label = targetable
          ? { text: '→ equip here', color: '#2a4060' }
          : { text: 'Empty',       color: '#252535' };
        const emptyText = this.add.text(cardX + cardW / 2, cardY + cardH / 2, label.text, {
          fontSize: '13px', color: label.color, fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(emptyText);
      }

      // Every equipped slot is interactive — click equips the selected item.
      const sn = slotNum;
      const zone = this.add
        .zone(cardX, cardY, cardW, cardH)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      zone.on('pointerup', () => {
        if (this.selectedIndex >= 0) {
          this.equipToSlot(sn);
        }
        // No item selected → do nothing.
      });
      zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
        gfx.clear();
        this.drawEquipCard(gfx, cardX, cardY, cardW, cardH, weapon, true, targetable);
        if (weapon && !targetable) {
          this.tooltip.show(weapon.getInventoryTooltipData(), pointer.x, pointer.y);
        }
      });
      zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        this.tooltip.moveTo(pointer.x, pointer.y);
      });
      zone.on('pointerout', () => {
        gfx.clear();
        this.drawEquipCard(gfx, cardX, cardY, cardW, cardH, weapon, false, targetable);
        this.tooltip.hide();
      });
      this.dynamicObjects.push(zone);
    }
  }

  private drawEquipCard(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number, w: number, h: number,
    weapon: Weapon | null,
    hover: boolean,
    targetable: boolean,
  ) {
    gfx.fillStyle(hover ? 0x0f1220 : 0x090b17, 0.95);
    gfx.fillRect(x, y, w, h);
    if (targetable) {
      gfx.lineStyle(2, hover ? 0x7799cc : 0x2a4060, 1);
    } else if (weapon) {
      gfx.lineStyle(2, weapon.rarityColor, hover ? 1 : 0.85);
    } else {
      gfx.lineStyle(1.5, 0x1e2030, 1);
    }
    gfx.strokeRect(x, y, w, h);
  }

  // ── Right panel: inventory grid ─────────────────────────────────

  private buildInventoryGrid() {
    const weapons = this.inventorySystem.getAll();
    const gridX = RIGHT_X;
    const gridY = CONTENT_Y;

    for (let i = 0; i < 12; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cx = gridX + col * (CARD_W + CARD_GAP);
      const cy = gridY + row * (CARD_H + CARD_GAP);
      const weapon = weapons[i];
      const selected = this.selectedIndex === i;

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      this.drawGridCard(gfx, cx, cy, weapon, selected, false);

      if (weapon) {
        const colorHex = `#${weapon.rarityColor.toString(16).padStart(6, '0')}`;

        const weaponSprite = this.add.image(cx + CARD_W / 2, cy + 22, weapon.textureKey)
          .setScale(1.5)
          .setRotation(-Math.PI / 4)
          .setAlpha(0.92);
        this.dynamicObjects.push(weaponSprite);

        const nameText = this.add.text(cx + CARD_W / 2, cy + 47, weapon.displayName, {
          fontSize: '9px', color: '#ccdde8', fontFamily: 'monospace',
          align: 'center', wordWrap: { width: CARD_W - 8 },
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(nameText);

        const rarityText = this.add.text(cx + CARD_W / 2, cy + 59, weapon.rarity, {
          fontSize: '8px', color: colorHex, fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);
        this.dynamicObjects.push(rarityText);

        const capturedI = i;
        const zone = this.add
          .zone(cx, cy, CARD_W, CARD_H)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerup', () => {
          this.selectedIndex = this.selectedIndex === capturedI ? -1 : capturedI;
          this.rebuildDisplay();
        });
        zone.on('pointerover', (pointer: Phaser.Input.Pointer) => {
          if (!selected) { gfx.clear(); this.drawGridCard(gfx, cx, cy, weapon, false, true); }
          this.tooltip.show(weapon.getInventoryTooltipData(), pointer.x, pointer.y);
        });
        zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
          this.tooltip.moveTo(pointer.x, pointer.y);
        });
        zone.on('pointerout', () => {
          if (!selected) { gfx.clear(); this.drawGridCard(gfx, cx, cy, weapon, false, false); }
          this.tooltip.hide();
        });
        this.dynamicObjects.push(zone);
      }
    }

  }

  private drawGridCard(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number,
    weapon: Weapon | null,
    selected: boolean,
    hover: boolean,
  ) {
    if (selected) {
      gfx.fillStyle(0x141830, 1);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(2, 0x88aaff, 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    } else if (hover && weapon) {
      gfx.fillStyle(0x121526, 1);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(2, weapon.rarityColor, 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    } else {
      gfx.fillStyle(0x090b17, 0.9);
      gfx.fillRect(x, y, CARD_W, CARD_H);
      gfx.lineStyle(weapon ? 1.5 : 1, weapon ? weapon.rarityColor : 0x1a1a2a, weapon ? 0.75 : 1);
      gfx.strokeRect(x, y, CARD_W, CARD_H);
    }
  }

  // ── Equip / unequip logic ───────────────────────────────────────

  private equipToSlot(slotNum: 1 | 2) {
    const weapon = this.inventorySystem.getAll()[this.selectedIndex] as Weapon | null;
    if (!weapon) return;

    const existing = this.player.getEquippedWeapon(slotNum);
    if (existing) this.inventorySystem.addWeapon(existing);

    this.inventorySystem.removeAt(this.selectedIndex);
    this.player.equipWeapon(weapon, slotNum);
    this.selectedIndex = -1;
    this.rebuildDisplay();
  }

  private unequipSlot(slotNum: 1 | 2) {
    const weapon = this.player.getEquippedWeapon(slotNum);
    if (!weapon || this.inventorySystem.isFull()) return;
    this.player.unequipSlot(slotNum);
    this.inventorySystem.addWeapon(weapon);
    this.rebuildDisplay();
  }
}
