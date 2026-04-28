import Phaser from 'phaser';
import type { CraftingInventory } from '../systems/CraftingInventory';
import type { InventorySystem } from '../systems/InventorySystem';
import { MATERIAL_DEFINITIONS, CRAFTING_RECIPES } from '../config/CraftingConfig';
import type { CraftingRecipe } from '../config/CraftingConfig';
import { WeaponFactory } from '../combat/WeaponFactory';
import { GAME_FONT_FAMILY } from '../config/FontConfig';
import type { GameScene } from './GameScene';

// ── Layout constants ──────────────────────────────────────────────────────────

const CELL = 50;
const GAP  = 6;
const COLS = 5;
const ROWS = 5;
const GRID_DIM = CELL * COLS + GAP * (COLS - 1); // 274

const PW = 460;
const PH = 440;

const PANEL_BG   = 0x070e0a;
const PANEL_EDGE = 0x2a4a30;

// ── Selected-item discriminated union ────────────────────────────────────────

type SelectedResource = { source: 'resource'; materialId: string };
type SelectedGrid     = { source: 'grid'; row: number; col: number };
type Selected = SelectedResource | SelectedGrid;

// ── Scene ─────────────────────────────────────────────────────────────────────

export class CraftingScene extends Phaser.Scene {
  private craftingInventory!: CraftingInventory;
  private inventorySystem!: InventorySystem;

  private grid: (string | null)[][] = [];
  private selected: Selected | null = null;

  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private cKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  // Screen-space layout, computed in create()
  private pX = 0;
  private pY = 0;
  private gX = 0;  // grid top-left x
  private gY = 0;  // grid top-left y
  private outCX = 0;
  private outCY = 0;
  private resY = 0;

  constructor() {
    super({ key: 'CraftingScene' });
  }

  init(data: { craftingInventory: CraftingInventory; inventorySystem: InventorySystem }) {
    this.craftingInventory = data.craftingInventory;
    this.inventorySystem   = data.inventorySystem;
    this.grid     = Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
    this.selected = null;
  }

  create() {
    const VW = this.scale.width;
    const VH = this.scale.height;

    this.pX = Math.floor((VW - PW) / 2);
    this.pY = Math.floor((VH - PH) / 2);
    this.gX = this.pX + 22;
    this.gY = this.pY + 50;
    this.outCX = this.pX + 352;
    this.outCY = this.gY + Math.floor(GRID_DIM / 2);   // vertical centre of grid
    this.resY  = this.gY + GRID_DIM + 14;              // top of resource area

    // ── Screen overlay ──────────────────────────────────────────────
    this.add.rectangle(0, 0, VW, VH, 0x000000, 0.65).setOrigin(0, 0);

    // ── Static chrome ───────────────────────────────────────────────
    const chrome = this.add.graphics();
    chrome.fillStyle(PANEL_BG, 0.97);
    chrome.fillRect(this.pX, this.pY, PW, PH);
    chrome.lineStyle(1.5, PANEL_EDGE, 1);
    chrome.strokeRect(this.pX, this.pY, PW, PH);

    // Header separator
    chrome.lineStyle(1, PANEL_EDGE, 0.55);
    chrome.strokeLineShape(
      new Phaser.Geom.Line(this.pX, this.pY + 34, this.pX + PW, this.pY + 34),
    );
    // Resource section separator
    const sepY = this.resY - 12;
    chrome.strokeLineShape(
      new Phaser.Geom.Line(this.pX, sepY, this.pX + PW, sepY),
    );

    // Title
    this.add.text(this.pX + 14, this.pY + 17, 'CRAFTING', {
      fontSize: '16px', color: '#88ddaa', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Close hint
    this.add.text(this.pX + PW - 14, this.pY + 17, 'C / ESC', {
      fontSize: '10px', color: '#3a5a3a', fontFamily: GAME_FONT_FAMILY,
    }).setOrigin(1, 0.5);

    // Section labels
    this.add.text(this.gX, this.pY + 46, 'GRID', {
      fontSize: '10px', color: '#4a6a4a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0, 1);

    this.add.text(this.outCX, this.pY + 46, 'OUTPUT', {
      fontSize: '10px', color: '#4a6a4a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    // ── Keys ────────────────────────────────────────────────────────
    this.cKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ── Resize ──────────────────────────────────────────────────────
    const onResize = () => {
      if (!this.scene.isActive()) return;
      this.returnGridToInventory();
      this.scene.restart();
    };
    this.scale.on('resize', onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', onResize, this));

    this.rebuildDisplay();
  }

  update() {
    if (
      Phaser.Input.Keyboard.JustDown(this.cKey) ||
      Phaser.Input.Keyboard.JustDown(this.escKey)
    ) {
      this.closeMenu();
    }
  }

  // ── Display rebuild ───────────────────────────────────────────────────────

  private rebuildDisplay() {
    for (const obj of this.dynamicObjects) obj.destroy();
    this.dynamicObjects = [];
    this.buildGrid();
    this.buildOutputSlot();
    this.buildResourceArea();
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  private buildGrid() {
    const isItemSelected = this.selected !== null;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = this.gX + c * (CELL + GAP);
        const cy = this.gY + r * (CELL + GAP);
        const matId = this.grid[r][c];
        const isThis = this.selected?.source === 'grid' &&
          (this.selected as SelectedGrid).row === r &&
          (this.selected as SelectedGrid).col === c;
        const isTarget = isItemSelected && !isThis;

        const gfx = this.add.graphics();
        this.dynamicObjects.push(gfx);
        this.drawCell(gfx, cx, cy, matId, isThis, isTarget, false);

        if (matId) {
          const def = MATERIAL_DEFINITIONS[matId];
          if (def) {
            const icon = this.add.image(cx + CELL / 2, cy + CELL / 2, def.textureKey).setScale(1.3);
            this.dynamicObjects.push(icon);
          }
        }

        const capR = r, capC = c, capMat = matId;
        const zone = this.add.zone(cx, cy, CELL, CELL)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerup',   ()  => this.onGridClick(capR, capC));
        zone.on('pointerover', ()  => { gfx.clear(); this.drawCell(gfx, cx, cy, capMat, isThis, isTarget, true); });
        zone.on('pointerout',  ()  => { gfx.clear(); this.drawCell(gfx, cx, cy, capMat, isThis, isTarget, false); });
        this.dynamicObjects.push(zone);
      }
    }
  }

  private drawCell(
    gfx: Phaser.GameObjects.Graphics,
    x: number, y: number,
    matId: string | null,
    selected: boolean, targetable: boolean, hover: boolean,
  ) {
    gfx.fillStyle(hover ? 0x0e1610 : 0x090b17, 0.95);
    gfx.fillRect(x, y, CELL, CELL);

    if (selected) {
      gfx.lineStyle(2, 0x44cc66, 1);
    } else if (targetable && !matId) {
      gfx.lineStyle(1.5, hover ? 0x44aa66 : 0x1e3a22, 1);
    } else if (matId) {
      const def = MATERIAL_DEFINITIONS[matId];
      gfx.lineStyle(1.5, def ? def.color : 0x555566, hover ? 0.95 : 0.7);
    } else {
      gfx.lineStyle(1, 0x182018, 1);
    }
    gfx.strokeRect(x, y, CELL, CELL);
  }

  // ── Output slot ───────────────────────────────────────────────────────────

  private buildOutputSlot() {
    const { outCX: cx, outCY: cy } = this;
    const recipe = this.checkRecipe();
    const S = 60;
    const ox = cx - S / 2;
    const oy = cy - S / 2;
    const arrowX = this.gX + GRID_DIM + 12;

    // Arrow
    const arrowGfx = this.add.graphics();
    const acol = recipe ? 0x44cc66 : 0x2a4a2a;
    const aalpha = recipe ? 0.9 : 0.4;
    arrowGfx.lineStyle(2, acol, aalpha);
    arrowGfx.strokeLineShape(new Phaser.Geom.Line(arrowX, cy, arrowX + 20, cy));
    arrowGfx.fillStyle(acol, aalpha);
    arrowGfx.fillTriangle(arrowX + 20, cy - 6, arrowX + 30, cy, arrowX + 20, cy + 6);
    this.dynamicObjects.push(arrowGfx);

    // Slot background
    const slotGfx = this.add.graphics();
    this.dynamicObjects.push(slotGfx);
    const drawSlot = (hov: boolean) => {
      slotGfx.clear();
      slotGfx.fillStyle(hov ? 0x0e1610 : 0x090b17, 0.95);
      slotGfx.fillRect(ox, oy, S, S);
      slotGfx.lineStyle(recipe ? 2 : 1.5, recipe ? (hov ? 0x66ff88 : 0x44cc66) : 0x1e3a22, recipe ? 1 : 0.5);
      slotGfx.strokeRect(ox, oy, S, S);
    };
    drawSlot(false);

    if (recipe) {
      const weapon = WeaponFactory.create(recipe.resultWeaponId, recipe.resultRarity);

      const icon = this.add.image(cx, cy, weapon.textureKey)
        .setScale(1.8)
        .setRotation(-Math.PI / 4)
        .setAlpha(0.95);
      this.dynamicObjects.push(icon);

      const hex = `#${weapon.rarityColor.toString(16).padStart(6, '0')}`;
      const nameTxt = this.add.text(cx, oy + S + 8, weapon.displayName, {
        fontSize: '9px', color: hex, fontFamily: GAME_FONT_FAMILY, align: 'center',
      }).setOrigin(0.5, 0);
      this.dynamicObjects.push(nameTxt);

      const zone = this.add.zone(ox, oy, S, S)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerup',   () => this.onOutputClick());
      zone.on('pointerover', () => drawSlot(true));
      zone.on('pointerout',  () => drawSlot(false));
      this.dynamicObjects.push(zone);
    } else {
      const q = this.add.text(cx, cy, '?', {
        fontSize: '22px', color: '#1e3a22', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0.5, 0.5);
      this.dynamicObjects.push(q);
    }
  }

  // ── Resource area ─────────────────────────────────────────────────────────

  private buildResourceArea() {
    const matIds = Object.keys(MATERIAL_DEFINITIONS);
    const CARD_W = 128, CARD_H = 58, CARD_GAP = 10;
    const totalW = matIds.length * CARD_W + (matIds.length - 1) * CARD_GAP;
    const startX = this.pX + Math.floor((PW - totalW) / 2);
    const startY = this.resY + 2;

    const resLabel = this.add.text(this.gX, this.resY - 5, 'RESOURCES', {
      fontSize: '10px', color: '#4a6a4a', fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0, 1);
    this.dynamicObjects.push(resLabel);

    matIds.forEach((matId, i) => {
      const def = MATERIAL_DEFINITIONS[matId];
      const count = this.craftingInventory.get(matId);
      const rx = startX + i * (CARD_W + CARD_GAP);
      const ry = startY;
      const isSel = this.selected?.source === 'resource' &&
        (this.selected as SelectedResource).materialId === matId;
      const hasStock = count > 0;
      const isGridSel = this.selected?.source === 'grid';

      const gfx = this.add.graphics();
      this.dynamicObjects.push(gfx);
      const drawCard = (hov: boolean) => {
        gfx.clear();
        gfx.fillStyle(hov ? 0x0e1610 : 0x090b17, 0.95);
        gfx.fillRect(rx, ry, CARD_W, CARD_H);
        if (isSel) {
          gfx.lineStyle(2, 0x44cc66, 1);
        } else if (!hasStock && !isGridSel) {
          gfx.lineStyle(1, 0x182018, 0.6);
        } else {
          gfx.lineStyle(1.5, hov ? def.color : PANEL_EDGE, hov ? 0.9 : 0.7);
        }
        gfx.strokeRect(rx, ry, CARD_W, CARD_H);
      };
      drawCard(false);

      // Icon
      const icon = this.add.image(rx + 8 + 14, ry + CARD_H / 2, def.textureKey)
        .setAlpha(hasStock ? 0.95 : 0.35)
        .setScale(1.1);
      this.dynamicObjects.push(icon);

      // Name
      const nameTxt = this.add.text(rx + 36, ry + 14, def.displayName, {
        fontSize: '9px', color: hasStock ? '#99ccaa' : '#3a5a3a', fontFamily: GAME_FONT_FAMILY,
      }).setOrigin(0, 0.5);
      this.dynamicObjects.push(nameTxt);

      // Count
      const cntTxt = this.add.text(rx + 36, ry + 32, `×${count}`, {
        fontSize: '13px',
        color: hasStock ? '#88ccff' : '#2a4a2a',
        fontFamily: GAME_FONT_FAMILY,
        fontStyle: hasStock ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);
      this.dynamicObjects.push(cntTxt);

      if (hasStock || isGridSel) {
        const zone = this.add.zone(rx, ry, CARD_W, CARD_H)
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });
        zone.on('pointerup',   () => this.onResourceClick(matId));
        zone.on('pointerover', () => drawCard(true));
        zone.on('pointerout',  () => drawCard(false));
        this.dynamicObjects.push(zone);
      }
    });
  }

  // ── Interaction handlers ──────────────────────────────────────────────────

  private onResourceClick(materialId: string) {
    // Grid item held → return it to this resource slot
    if (this.selected?.source === 'grid') {
      const { row, col } = this.selected as SelectedGrid;
      const gridMat = this.grid[row][col];
      if (gridMat) {
        this.craftingInventory.add(gridMat, 1);
        this.grid[row][col] = null;
      }
      this.selected = null;
      this.rebuildDisplay();
      return;
    }

    // Same resource already selected → deselect
    if (this.selected?.source === 'resource' &&
        (this.selected as SelectedResource).materialId === materialId) {
      this.selected = null;
      this.rebuildDisplay();
      return;
    }

    // Select (if stock available)
    if (this.craftingInventory.get(materialId) > 0) {
      this.selected = { source: 'resource', materialId };
      this.rebuildDisplay();
    }
  }

  private onGridClick(row: number, col: number) {
    const cell = this.grid[row][col];

    if (this.selected?.source === 'resource') {
      const { materialId } = this.selected as SelectedResource;
      // Swap existing cell content back to resources if occupied
      if (cell !== null) this.craftingInventory.add(cell, 1);
      this.craftingInventory.remove(materialId, 1);
      this.grid[row][col] = materialId;
      this.selected = null;
      this.rebuildDisplay();
      return;
    }

    if (this.selected?.source === 'grid') {
      const { row: sr, col: sc } = this.selected as SelectedGrid;
      if (sr === row && sc === col) {
        // Tap same cell → deselect
        this.selected = null;
      } else {
        // Move / swap
        const srcMat = this.grid[sr][sc];
        this.grid[sr][sc] = cell;
        this.grid[row][col] = srcMat;
        this.selected = null;
      }
      this.rebuildDisplay();
      return;
    }

    // Nothing selected — pick up from grid
    if (cell !== null) {
      this.selected = { source: 'grid', row, col };
      this.rebuildDisplay();
    }
  }

  private onOutputClick() {
    const recipe = this.checkRecipe();
    if (!recipe) return;

    // Consume matching grid slots
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (recipe.pattern[r][c] !== null) this.grid[r][c] = null;
      }
    }
    this.selected = null;

    // Create weapon → inventory
    const weapon = WeaponFactory.create(recipe.resultWeaponId, recipe.resultRarity);
    this.inventorySystem.addWeapon(weapon);

    // Trigger loot feed in UIScene
    const gameScene = this.scene.get('GameScene') as GameScene;
    gameScene.events.emit('lootReceived', weapon);

    this.rebuildDisplay();
  }

  // ── Recipe matching ───────────────────────────────────────────────────────

  private checkRecipe(): CraftingRecipe | null {
    for (const recipe of CRAFTING_RECIPES) {
      let match = true;
      outer: for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if ((this.grid[r][c] ?? null) !== (recipe.pattern[r][c] ?? null)) {
            match = false;
            break outer;
          }
        }
      }
      if (match) return recipe;
    }
    return null;
  }

  // ── Close / cleanup ───────────────────────────────────────────────────────

  private returnGridToInventory() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c]) {
          this.craftingInventory.add(this.grid[r][c]!, 1);
          this.grid[r][c] = null;
        }
      }
    }
  }

  private closeMenu() {
    this.returnGridToInventory();
    this.selected = null;
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
