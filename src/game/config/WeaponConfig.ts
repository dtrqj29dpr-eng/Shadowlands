import type { AttackType, WeaponDefinition, WeaponType } from '../types/GameTypes';

/** Human-readable label for each attack type, used in tooltips. */
export const ATTACK_TYPE_NAMES: Record<AttackType, string> = {
  returning_throw: 'Returning Sword Throw',
};

/** Human-readable label for each weapon type, used in tooltips. */
export const WEAPON_TYPE_NAMES: Record<WeaponType, string> = {
  throwable: 'Throwable Weapon',
};

export const WEAPON_DEFINITIONS: Record<string, WeaponDefinition> = {
  iron_sword: {
    id: 'iron_sword',
    displayName: 'Iron Sword',
    textureKey: 'iron-sword',
    weaponType: 'throwable',
    attackType: 'returning_throw',
    baseRarity: 'Common',
    damage: 12,
    strength: 10,
    cooldownMs: 1000,
    throwSpeed: 460,
    returnSpeed: 420,
    returnAcceleration: 1000,
    maxReturnSpeed: 1300,
    maxRange: 290,
    catchDistance: 24,
    pierce: 0,
    knockback: 100,
    description: 'A sturdy sword forged from iron bars. Returns when thrown.',
  },
  wooden_sword: {
    id: 'wooden_sword',
    displayName: 'Wooden Sword',
    textureKey: 'sword-projectile',
    weaponType: 'throwable',
    attackType: 'returning_throw',
    baseRarity: 'Common',
    damage: 10,
    strength: 5,
    cooldownMs: 1200,
    throwSpeed: 420,
    returnSpeed: 380,
    returnAcceleration: 900,
    maxReturnSpeed: 1200,
    maxRange: 263,
    catchDistance: 24,
    pierce: 0,
    knockback: 80,
    description: 'A battered training sword. It returns when thrown.',
  },
};
