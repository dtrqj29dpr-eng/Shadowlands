import type { Rarity, TooltipItemData } from '../types/GameTypes';
import { RARITIES } from '../config/RarityConfig';

export class Artifact {
  readonly id: string;
  readonly displayName: string;
  readonly textureKey: string;
  readonly rarity: Rarity;
  readonly rarityColor: number;

  constructor(id: string, displayName: string, textureKey: string, rarity: Rarity) {
    this.id = id;
    this.displayName = displayName;
    this.textureKey = textureKey;
    this.rarity = rarity;
    this.rarityColor = RARITIES[rarity].color;
  }

  getInventoryTooltipData(): TooltipItemData {
    return {
      name: this.displayName,
      rarity: this.rarity,
      rarityColor: this.rarityColor,
      itemType: 'Artifact',
      stats: [],
      rarityAtBottom: true,
    };
  }
}
