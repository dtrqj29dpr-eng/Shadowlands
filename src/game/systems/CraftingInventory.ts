export class CraftingInventory {
  private readonly items = new Map<string, number>();

  add(id: string, amount: number): void {
    this.items.set(id, (this.items.get(id) ?? 0) + amount);
  }

  /** Returns false if insufficient stock — does NOT partially remove. */
  remove(id: string, amount: number): boolean {
    const current = this.items.get(id) ?? 0;
    if (current < amount) return false;
    const next = current - amount;
    if (next === 0) this.items.delete(id);
    else this.items.set(id, next);
    return true;
  }

  get(id: string): number {
    return this.items.get(id) ?? 0;
  }

  getAll(): ReadonlyMap<string, number> {
    return this.items;
  }
}
