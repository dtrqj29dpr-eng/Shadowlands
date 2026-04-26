import type { AttackType, Rarity, TooltipItemData, TooltipStatRow, WeaponDefinition, WeaponType, RarityDefinition } from '../types/GameTypes';
import { ATTACK_TYPE_NAMES, WEAPON_TYPE_NAMES } from '../config/WeaponConfig';

export class Weapon {
  readonly id: string;
  readonly displayName: string;
  readonly weaponType: WeaponType;
  readonly attackType: AttackType;
  readonly rarity: Rarity;
  readonly rarityColor: number;
  readonly damage: number;
  readonly strength: number;  // flat bonus to player strength, not scaled by rarity
  readonly cooldownMs: number;
  readonly throwSpeed: number;
  readonly returnSpeed: number;
  readonly maxRange: number;
  readonly pierce: number;
  readonly knockback: number;
  readonly description: string;

  constructor(def: WeaponDefinition, rarity: Rarity, rarityDef: RarityDefinition) {
    this.id = def.id;
    this.displayName = def.displayName;
    this.weaponType = def.weaponType;
    this.attackType = def.attackType;
    this.rarity = rarity;
    this.rarityColor = rarityDef.color;
    this.damage = Math.round(def.damage * rarityDef.damageMultiplier);
    this.strength = def.strength;
    this.cooldownMs = Math.round(def.cooldownMs * rarityDef.cooldownMultiplier);
    this.throwSpeed = def.throwSpeed * rarityDef.speedMultiplier;
    this.returnSpeed = def.returnSpeed * rarityDef.speedMultiplier;
    this.maxRange = def.maxRange * rarityDef.rangeMultiplier;
    this.pierce = def.pierce;
    this.knockback = def.knockback;
    this.description = def.description;
  }

  getTooltipData(): TooltipItemData {
    return {
      name: this.displayName,
      rarity: this.rarity,
      rarityColor: this.rarityColor,
      itemType: WEAPON_TYPE_NAMES[this.weaponType],
      attackType: ATTACK_TYPE_NAMES[this.attackType],
      stats: [
        { label: 'Damage',   value: String(this.damage) },
        { label: 'Strength', value: String(this.strength) },
        { label: 'Cooldown', value: `${(this.cooldownMs / 1000).toFixed(1)}s` },
      ],
    };
  }

  getInventoryTooltipData(): TooltipItemData {
    const stats: TooltipStatRow[] = [
      { label: 'Damage',   value: String(this.damage) },
      { label: 'Strength', value: String(this.strength) },
    ];
    if (this.pierce > 0) stats.push({ label: 'Pierce', value: String(this.pierce) });
    return {
      name: this.displayName,
      rarity: this.rarity,
      rarityColor: this.rarityColor,
      stats,
      rarityAtBottom: true,
    };
  }
}
