import type { AttackType, WeaponDefinition } from '../types/GameTypes';

/** Human-readable label for each attack type, used in tooltips. */
export const ATTACK_TYPE_NAMES: Record<AttackType, string> = {
  returning_throw: 'Returning Sword Throw',
};

export const WEAPON_DEFINITIONS: Record<string, WeaponDefinition> = {
  wooden_sword: {
    id: 'wooden_sword',
    displayName: 'Wooden Sword',
    weaponType: 'throwable',
    attackType: 'returning_throw',
    baseRarity: 'Common',
    damage: 10,
    strength: 5,
    cooldownMs: 1200,
    throwSpeed: 420,
    returnSpeed: 380,
    maxRange: 350,
    pierce: 0,
    knockback: 80,
    description: 'A battered training sword. It returns when thrown.',
  },
};
