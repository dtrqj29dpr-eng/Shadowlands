import type { Rarity } from '../types/GameTypes';

export interface MaterialDefinition {
  id: string;
  displayName: string;
  textureKey: string;
  color: number;
}

export interface CraftingRecipe {
  id: string;
  resultWeaponId: string;
  resultRarity: Rarity;
  /** Full ROWS×COLS grid pattern. null = must be empty. */
  pattern: (string | null)[][];
}

export const MATERIAL_DEFINITIONS: Record<string, MaterialDefinition> = {
  wooden_log: {
    id: 'wooden_log',
    displayName: 'Wooden Log',
    textureKey: 'wooden-log',
    color: 0x8b5a2b,
  },
  iron_bar: {
    id: 'iron_bar',
    displayName: 'Iron Bar',
    textureKey: 'iron-bar',
    color: 0x8899aa,
  },
};

// Row 0: --i--   Row 1: --i--   Row 2: --i--
// Row 3: -www-   Row 4: --w--
export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'iron_sword',
    resultWeaponId: 'iron_sword',
    resultRarity: 'Common',
    pattern: [
      [null,         null,         'iron_bar',   null,         null],
      [null,         null,         'iron_bar',   null,         null],
      [null,         null,         'iron_bar',   null,         null],
      [null,         'wooden_log', 'wooden_log', 'wooden_log', null],
      [null,         null,         'wooden_log', null,         null],
    ],
  },
];
