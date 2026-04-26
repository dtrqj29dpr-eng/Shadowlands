import type { EnemyDefinition } from '../types/GameTypes';

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  slime: {
    id: 'slime',
    displayName: 'Slime',
    hp: 50,
    speed: 80,
    detectionRange: 250,
    abandonRange: 400,
    contactDamage: 8,
    damageIntervalMs: 600,
    dropTable: [
      { resourceType: 'coin', minAmount: 1, maxAmount: 3, chance: 0.85 },
    ],
  },
};
