import Phaser from 'phaser';
import type { EnemyDefinition, EnemyState } from '../../types/GameTypes';
import type { DropSystem } from '../../systems/DropSystem';
import { GAME_CONFIG } from '../../config/GameConfig';
import { FloatingCombatText } from '../../ui/FloatingCombatText';

// Minimal interface so BaseEnemy can query player position without importing GameScene.
export interface IEnemySceneContext {
  getPlayerPosition(): { x: number; y: number };
  getDropSystem(): DropSystem;
  time: Phaser.Time.Clock;
}

export abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  protected hp: number;
  protected maxHp: number;
  protected aiState: EnemyState = 'wandering';
  protected wanderTarget: { x: number; y: number } | null = null;
  protected wanderTimer: number = 0;
  protected definition: EnemyDefinition;

  // Exposed publicly so CollisionSystem can read them without casting.
  public lastDamageTime: number = 0;
  public get damageIntervalMs(): number { return this.definition.damageIntervalMs; }
  public get contactDamage(): number { return this.definition.contactDamage; }

  protected ctx!: IEnemySceneContext;

  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private healthBarFg!: Phaser.GameObjects.Rectangle;
  private readonly barW: number;
  private static readonly BAR_H = 4;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    def: EnemyDefinition,
    ctx: IEnemySceneContext,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.definition = def;
    this.ctx = ctx;
    this.hp = def.hp;
    this.maxHp = def.hp;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setAllowGravity(false);

    this.barW = Math.round(this.displayWidth);
    this.healthBarBg = scene.add.rectangle(0, 0, this.barW, BaseEnemy.BAR_H, 0x0a0a12, 0.88)
      .setOrigin(0, 0).setDepth(5);
    this.healthBarFg = scene.add.rectangle(0, 0, this.barW, BaseEnemy.BAR_H, 0x44cc44)
      .setOrigin(0, 0).setDepth(6);
    this.updateHealthBar();
  }

  // Phaser calls this automatically when runChildUpdate:true on the group.
  update(_time: number, delta: number) {
    this.updateHealthBar();
    this.updateAI(delta);
  }

  protected updateAI(delta: number) {
    const pos = this.ctx.getPlayerPosition();
    const dist = Phaser.Math.Distance.Between(this.x, this.y, pos.x, pos.y);
    const { detectionRange, abandonRange } = this.definition;

    if (this.aiState === 'wandering' && dist < detectionRange) {
      this.aiState = 'chasing';
    } else if (this.aiState === 'chasing' && dist > abandonRange) {
      this.aiState = 'wandering';
      this.wanderTarget = null;
    }

    if (this.aiState === 'chasing') {
      this.chasePlayer(pos);
    } else {
      this.wander(delta);
    }
  }

  protected chasePlayer(pos: { x: number; y: number }) {
    this.scene.physics.moveTo(this, pos.x, pos.y, this.definition.speed);
  }

  protected wander(delta: number) {
    this.wanderTimer -= delta;

    if (this.wanderTimer <= 0 || !this.wanderTarget) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 100;
      const { width: W, height: H } = GAME_CONFIG.world;
      this.wanderTarget = {
        x: Phaser.Math.Clamp(this.x + Math.cos(angle) * radius, 50, W - 50),
        y: Phaser.Math.Clamp(this.y + Math.sin(angle) * radius, 50, H - 50),
      };
      this.wanderTimer = 2000 + Math.random() * 2000;
    }

    const dist = Phaser.Math.Distance.Between(
      this.x, this.y, this.wanderTarget.x, this.wanderTarget.y,
    );

    if (dist < 12) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.wanderTarget = null;
    } else {
      this.scene.physics.moveTo(
        this,
        this.wanderTarget.x,
        this.wanderTarget.y,
        this.definition.speed * 0.4,
      );
    }
  }

  takeDamage(amount: number, kbX: number, kbY: number, isCritical = false) {
    this.hp -= amount;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(kbX, kbY);

    this.setTint(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });

    FloatingCombatText.spawn(this.scene, this.x, this.y, Math.round(amount), isCritical);
    this.updateHealthBar();

    if (this.hp <= 0) {
      this.onDeath();
    }
  }

  protected onDeath() {
    if (this.healthBarBg.active) this.healthBarBg.destroy();
    if (this.healthBarFg.active) this.healthBarFg.destroy();
    this.ctx.getDropSystem().processDrop(this.definition.dropTable, this.x, this.y);
    this.destroy();
  }

  private updateHealthBar() {
    const barX = this.x - this.barW / 2;
    const barY = this.y - this.displayHeight / 2 - 8;
    const frac = Math.max(0, this.hp / this.maxHp);
    const fillW = Math.max(0.5, this.barW * frac);
    const fillColor = frac > 0.5 ? 0x44cc44 : frac > 0.25 ? 0xccaa22 : 0xcc2222;

    this.healthBarBg.setPosition(barX, barY);
    this.healthBarFg.setPosition(barX, barY).setSize(fillW, BaseEnemy.BAR_H).setFillStyle(fillColor);
  }
}
