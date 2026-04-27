import Phaser from 'phaser';
import { GAME_CONFIG } from './game/config/GameConfig';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { UIScene } from './game/scenes/UIScene';
import { InventoryScene } from './game/scenes/InventoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  title: GAME_CONFIG.title,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0a0a14',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GameScene, UIScene, InventoryScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    // Enable right mouse button tracking.
    activePointers: 3,
  },
};

const game = new Phaser.Game(config);

// Prevent browser context menu so RMB can be used as a game input.
game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
