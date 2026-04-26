import type { AttackType, Rarity, WeaponDefinition, WeaponType, RarityDefinition } from '../types/GameTypes';

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
}
