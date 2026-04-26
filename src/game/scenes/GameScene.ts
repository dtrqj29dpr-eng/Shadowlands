import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { MapBuilder } from '../world/MapBuilder';
import { Player } from '../entities/Player';
import { Chest } from '../entities/objects/Chest';
import { ResourceSystem } from '../systems/ResourceSystem';
import { InputSystem } from '../systems/InputSystem';
import { DropSystem } from '../systems/DropSystem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { IEnemySceneContext } from '../entities/enemies/BaseEnemy';

export class GameScene extends Phaser.Scene implements IEnemySceneContext {
  // Exposed to UIScene (read-only access is intentional — UIScene only reads).
  player!: Player;
  resourceSystem!: ResourceSystem;

  // Groups must be class properties so CollisionSystem and other systems can reference them.
  enemyGroup!: Phaser.Physics.Arcade.Group;
  projectileGroup!: Phaser.Physics.Arcade.Group;
  coinGroup!: Phaser.Physics.Arcade.Group;

  private chest!: Chest;
  private inputSystem!: InputSystem;
  private dropSystem!: DropSystem;
  private enemySpawner!: EnemySpawner;
  private combatSystem!: CombatSystem;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width: W, height: H } = GAME_CONFIG.world;

    // ── Physics world ────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, W, H);
    this.physics.world.gravity.set(0, 0);

    // ── Map ──────────────────────────────────────────────────────
    const mapBuilder = new MapBuilder();
    const obstacleGroup = mapBuilder.build(this);

    // ── Physics groups ───────────────────────────────────────────
    // runChildUpdate:true on enemyGroup so Slime.update() fires automatically.
    this.enemyGroup = this.physics.add.group({ runChildUpdate: true });
    // projectileGroup: NOT runChildUpdate — CombatSystem drives these manually.
    this.projectileGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();

    // ── Core systems ─────────────────────────────────────────────
    this.resourceSystem = new ResourceSystem();
    this.inputSystem = new InputSystem(this);
    this.dropSystem = new DropSystem(this, this.coinGroup, this.resourceSystem);

    // ── Entities ─────────────────────────────────────────────────
    const spawnX = W / 2;
    const spawnY = H / 2;
    this.player = new Player(this, spawnX, spawnY);

    this.chest = new Chest(
      this,
      spawnX + GAME_CONFIG.chest.spawnOffsetX,
      spawnY + GAME_CONFIG.chest.spawnOffsetY,
    );

    // ── Enemy spawner ─────────────────────────────────────────────
    this.enemySpawner = new EnemySpawner(this, this.enemyGroup, this);
    this.enemySpawner.spawnInitial();

    // ── Collision wiring ─────────────────────────────────────────
    new CollisionSystem(
      this,
      this.player,
      this.enemyGroup,
      this.projectileGroup,
      obstacleGroup,
      this.coinGroup,
      this.resourceSystem,
    );

    // ── Combat system ─────────────────────────────────────────────
    this.combatSystem = new CombatSystem(this.projectileGroup);

    // ── Camera ───────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(
      this.player,
      true,
      GAME_CONFIG.camera.lerpX,
      GAME_CONFIG.camera.lerpY,
    );

    // ── Launch UI scene in parallel ───────────────────────────────
    this.scene.launch('UIScene');
  }

  update(time: number, delta: number) {
    this.inputSystem.update();

    // Weapon firing.
    if (this.inputSystem.wasLMBPressed()) {
      const wp = this.inputSystem.getWorldPointer();
      this.player.fireSlot(1, wp.x, wp.y, this.projectileGroup);
    }
    if (this.inputSystem.wasRMBPressed()) {
      const wp = this.inputSystem.getWorldPointer();
      this.player.fireSlot(2, wp.x, wp.y, this.projectileGroup);
    }

    // Chest interaction.
    if (this.inputSystem.wasPressed('interact')) {
      this.chest.tryInteract(this.player, time);
    }

    // Entity updates.
    this.player.update(time, delta);
    this.combatSystem.update(time, delta);
    this.enemySpawner.update(time, delta);
  }

  // ── IEnemySceneContext implementation ─────────────────────────

  getPlayerPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  getDropSystem(): DropSystem {
    return this.dropSystem;
  }

  /** Whether the player is close enough to the chest to show the E prompt. */
  isNearChest(): boolean {
    if (this.chest.opened) return false;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.chest.x, this.chest.y,
    );
    return dist <= GAME_CONFIG.chest.interactRange;
  }
}
