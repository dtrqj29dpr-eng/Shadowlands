import type { Artifact } from '../combat/Artifact';

export class ArtifactInventory {
  private readonly MAX_SIZE = 20;
  private artifacts: (Artifact | null)[];

  constructor() {
    this.artifacts = new Array(this.MAX_SIZE).fill(null);
  }

  add(artifact: Artifact): boolean {
    const idx = this.artifacts.indexOf(null);
    if (idx === -1) return false;
    this.artifacts[idx] = artifact;
    return true;
  }

  removeAt(index: number): Artifact | null {
    const a = this.artifacts[index] ?? null;
    this.artifacts[index] = null;
    return a;
  }

  getAll(): (Artifact | null)[] {
    return [...this.artifacts];
  }

  getCount(): number {
    return this.artifacts.filter(a => a !== null).length;
  }

  isFull(): boolean {
    return !this.artifacts.includes(null);
  }

  readonly maxSize = 20;
}
