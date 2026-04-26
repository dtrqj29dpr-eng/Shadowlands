import type { WeaponDefinition } from '../types/GameTypes';

export const WEAPON_DEFINITIONS: Record<string, WeaponDefinition> = {
  wooden_sword: {
    id: 'wooden_sword',
    displayName: 'Wooden Sword',
    weaponType: 'throwable',
    baseRarity: 'Common',
    damage: 10,
    cooldownMs: 1200,
    throwSpeed: 420,
    returnSpeed: 380,
    maxRange: 350,
    pierce: 0,
    knockback: 80,
    description: 'A battered training sword. It returns when thrown.',
  },
};
