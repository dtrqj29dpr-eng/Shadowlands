import Phaser from 'phaser';

export class InputSystem {
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    interact: Phaser.Input.Keyboard.Key;
  };

  private lmbJustPressed: boolean = false;
  private rmbJustPressed: boolean = false;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard!;

    this.keys = {
      up:       kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:     kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      interact: kb.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    };

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown())  this.lmbJustPressed = true;
      if (pointer.rightButtonDown()) this.rmbJustPressed = true;
    });
  }

  /** Must be called once per frame (before reading any state). */
  update() {
    // Clearing is handled lazily in the was* getters.
  }

  wasPressed(action: 'interact'): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keys[action]);
  }

  wasLMBPressed(): boolean {
    const v = this.lmbJustPressed;
    this.lmbJustPressed = false;
    return v;
  }

  wasRMBPressed(): boolean {
    const v = this.rmbJustPressed;
    this.rmbJustPressed = false;
    return v;
  }

  getWorldPointer(): { x: number; y: number } {
    const pointer = this.scene.input.activePointer;
    return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }
}
