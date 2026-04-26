export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';
export type WeaponType = 'throwable';
export type ResourceType = 'coin';
export type ProjectilePhase = 'TRAVELING' | 'RETURNING' | 'IDLE';
export type EnemyState = 'wandering' | 'chasing';

export interface WeaponDefinition {
  id: string;
  displayName: string;
  weaponType: WeaponType;
  baseRarity: Rarity;
  damage: number;
  cooldownMs: number;
  throwSpeed: number;
  returnSpeed: number;
  maxRange: number;
  pierce: number;
  knockback: number;
  description: string;
}

export interface RarityDefinition {
  name: Rarity;
  displayName: string;
  color: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  rangeMultiplier: number;
  speedMultiplier: number;
}

export interface EnemyDefinition {
  id: string;
  displayName: string;
  hp: number;
  speed: number;
  detectionRange: number;
  abandonRange: number;
  contactDamage: number;
  damageIntervalMs: number;
  dropTable: DropEntry[];
}

export interface DropEntry {
  resourceType: ResourceType;
  minAmount: number;
  maxAmount: number;
  chance: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  iframeActive: boolean;
}

export interface SlotData {
  weaponName: string;
  rarity: Rarity;
  rarityColor: number;
  cooldownFraction: number;
  equipped: boolean;
}

export interface Vec2 {
  x: number;
  y: number;
}
