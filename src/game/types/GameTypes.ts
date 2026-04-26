export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';
export type WeaponType = 'throwable';
export type AttackType = 'returning_throw';
export type ResourceType = 'coin';
export type ProjectilePhase = 'TRAVELING' | 'RETURNING' | 'IDLE';
export type EnemyState = 'wandering' | 'chasing';

export interface WeaponDefinition {
  id: string;
  displayName: string;
  weaponType: WeaponType;
  attackType: AttackType;
  baseRarity: Rarity;
  damage: number;
  strength: number;   // flat bonus added to player strength when calculating damage
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

export interface PlayerAttributes {
  health: number;
  speed: number;      // movement speed % — 100 = default
  strength: number;   // bonus damage % — 10 means +10%
  critChance: number; // % chance to land a critical hit
  critDamage: number; // bonus damage % on crits — 50 means +50%
}

export interface DamageResult {
  finalDamage: number;
  isCritical: boolean;
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

export interface InventoryData {
  count: number;
}

export interface TooltipStatRow {
  label: string;
  value: string;
}

export interface TooltipItemData {
  name: string;
  rarity: Rarity;
  rarityColor: number;
  itemType: string;    // human-readable category, e.g. "Throwable Weapon"
  attackType: string;  // human-readable ability name, e.g. "Returning Sword Throw"
  stats: TooltipStatRow[];
}
