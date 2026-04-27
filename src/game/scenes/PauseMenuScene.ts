import Phaser from 'phaser';
import { GAME_FONT_FAMILY } from '../config/FontConfig';

const BTN_W = 160;
const BTN_H = 44;
const BTN_BG      = 0x6e1010;
const BTN_BG_HOV  = 0x8e2020;
const BTN_EDGE    = 0xdd2222;
const BTN_EDGE_HOV = 0xff4444;

export class PauseMenuScene extends Phaser.Scene {
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'PauseMenuScene' });
  }

  create() {
    const vw = this.scale.width;
    const vh = this.scale.height;

    this.add.rectangle(0, 0, vw, vh, 0x000000, 0.55).setOrigin(0, 0);

    const btnX = vw / 2 - BTN_W / 2;
    const btnY = vh / 2 - BTN_H / 2;

    const btn = this.add.graphics();
    this.drawBtn(btn, btnX, btnY, false);

    this.add.text(vw / 2, vh / 2, 'QUIT', {
      fontSize: '18px', color: '#ffbbbb',
      fontFamily: GAME_FONT_FAMILY, fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(1);

    const zone = this.add.zone(btnX, btnY, BTN_W, BTN_H)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerup',   () => window.close());
    zone.on('pointerover', () => this.drawBtn(btn, btnX, btnY, true));
    zone.on('pointerout',  () => this.drawBtn(btn, btnX, btnY, false));

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.resume('GameScene');
      this.scene.stop();
    }
  }

  private drawBtn(gfx: Phaser.GameObjects.Graphics, x: number, y: number, hover: boolean) {
    gfx.clear();
    gfx.fillStyle(hover ? BTN_BG_HOV : BTN_BG, 1);
    gfx.fillRect(x, y, BTN_W, BTN_H);
    gfx.lineStyle(2, hover ? BTN_EDGE_HOV : BTN_EDGE, 1);
    gfx.strokeRect(x, y, BTN_W, BTN_H);
  }
}
