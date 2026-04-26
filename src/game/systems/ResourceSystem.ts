import Phaser from 'phaser';
import type { ResourceType } from '../types/GameTypes';

export class ResourceSystem extends Phaser.Events.EventEmitter {
  private resources: Map<ResourceType, number> = new Map();

  constructor() {
    super();
    this.resources.set('coin', 0);
  }

  get(type: ResourceType): number {
    return this.resources.get(type) ?? 0;
  }

  add(type: ResourceType, amount: number) {
    const current = this.get(type);
    this.resources.set(type, current + amount);
    this.emit('change', type, this.get(type));
  }

  set(type: ResourceType, amount: number) {
    this.resources.set(type, amount);
    this.emit('change', type, amount);
  }
}
