import type { DamageResult, PlayerAttributes } from '../types/GameTypes';

export class DamageCalculator {
  /**
   * Applies strength scaling and a crit roll to produce the final hit damage.
   *
   * Non-crit:  d * ((100 + strength) / 100)
   * Crit:      d * ((100 + strength) / 100) * ((100 + critDamage) / 100)
   */
  static calculate(baseDamage: number, attacker: PlayerAttributes): DamageResult {
    const isCritical = Math.random() * 100 < attacker.critChance;
    const strengthMult = (100 + attacker.strength) / 100;
    const critMult = isCritical ? (100 + attacker.critDamage) / 100 : 1;
    const finalDamage = Math.round(baseDamage * strengthMult * critMult);
    return { finalDamage, isCritical };
  }
}
