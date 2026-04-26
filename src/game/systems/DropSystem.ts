import Phaser from 'phaser';
import type { DropEntry } from '../types/GameTypes';
import { Coin } from '../entities/objects/Coin';
import { ResourceSystem } from './ResourceSystem';
import { randomInt } from '../utils/MathUtils';

export class DropSystem {
  constructor(
    private scene: Phaser.Scene,
    private coinGroup: Phaser.Physics.Arcade.Group,
    private resourceSystem: ResourceSystem,
  ) {}

  processDrop(dropTable: DropEntry[], x: number, y: number) {
    for (const entry of dropTable) {
      if (Math.random() > entry.chance) continue;

      const amount = randomInt(entry.minAmount, entry.maxAmount);
      for (let i = 0; i < amount; i++) {
        const coin = new Coin(this.scene, x, y, 1);
        this.coinGroup.add(coin, true);
      }
    }
  }
}
