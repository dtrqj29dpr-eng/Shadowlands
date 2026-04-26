// Single source of truth for game-wide constants.
// To rename the game, change `title` here only.
export const GAME_CONFIG = {
  title: 'Shadowlands',
  version: '0.1.0',

  world: {
    width: 4000,
    height: 4000,
  },

  viewport: {
    width: 800,
    height: 600,
  },

  player: {
    baseSpeed: 200,      // pixels/sec at 100% speed stat
    maxHp: 100,
    strength: 10,
    critChance: 20,
    critDamage: 50,
    iframeDurationMs: 800,
    hitboxRadius: 14,
  },

  chest: {
    interactRange: 80,
    spawnOffsetX: 120,
    spawnOffsetY: 80,
  },

  enemies: {
    initialCount: 8,
    maxCount: 20,
    respawnIntervalMs: 5000,
    minSpawnDistFromPlayer: 300,
  },

  camera: {
    lerpX: 0.09,
    lerpY: 0.09,
  },
} as const;
