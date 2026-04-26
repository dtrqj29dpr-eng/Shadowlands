import type { Rarity } from '../types/GameTypes';
import { WEAPON_DEFINITIONS } from '../config/WeaponConfig';
import { RARITIES } from '../config/RarityConfig';
import { Weapon } from './Weapon';

export class WeaponFactory {
  static create(weaponId: string, rarity: Rarity): Weapon {
    const def = WEAPON_DEFINITIONS[weaponId];
    if (!def) throw new Error(`Unknown weapon id: "${weaponId}"`);
    const rarityDef = RARITIES[rarity];
    return new Weapon(def, rarity, rarityDef);
  }
}
