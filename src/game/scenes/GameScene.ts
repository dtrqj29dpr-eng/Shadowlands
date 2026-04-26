import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';
import { MapBuilder } from '../world/MapBuilder';
import { Player } from '../entities/Player';
import { Chest } from '../entities/objects/Chest';
import { ResourceSystem } from '../systems/ResourceSystem';
import { InputSystem } from '../systems/InputSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { DropSystem } from '../systems/DropSystem';
import { EnemySpawner } from '../systems/EnemySpawner';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { IEnemySceneContext } from '../entities/enemies/BaseEnemy';

export class GameScene extends Phaser.Scene implements IEnemySceneContext {
  player!: Player;
  resourceSystem!: ResourceSystem;
  inventorySystem!: InventorySystem;

  enemyGroup!: Phaser.Physics.Arcade.Group;
  projectileGroup!: Phaser.Physics.Arcade.Group;
  coinGroup!: Phaser.Physics.Arcade.Group;

  private chest!: Chest;
  private inputSystem!: InputSystem;
  private dropSystem!: DropSystem;
  private enemySpawner!: EnemySpawner;
  private combatSystem!: CombatSystem;
  private inventoryKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width: W, height: H } = GAME_CONFIG.world;

    this.physics.world.setBounds(0, 0, W, H);
    this.physics.world.gravity.set(0, 0);

    const mapBuilder = new MapBuilder();
    const obstacleGroup = mapBuilder.build(this);

    this.enemyGroup = this.physics.add.group({ runChildUpdate: true });
    this.projectileGroup = this.physics.add.group();
    this.coinGroup = this.physics.add.group();

    this.resourceSystem = new ResourceSystem();
    this.inventorySystem = new InventorySystem();
    this.inputSystem = new InputSystem(this);
    this.dropSystem = new DropSystem(this, this.coinGroup, this.resourceSystem);

    const spawnX = W / 2;
    const spawnY = H / 2;
    this.player = new Player(this, spawnX, spawnY);

    this.chest = new Chest(
      this,
      spawnX + GAME_CONFIG.chest.spawnOffsetX,
      spawnY + GAME_CONFIG.chest.spawnOffsetY,
    );

    this.enemySpawner = new EnemySpawner(this, this.enemyGroup, this);
    this.enemySpawner.spawnInitial();

    new CollisionSystem(
      this,
      this.player,
      this.enemyGroup,
      this.projectileGroup,
      obstacleGroup,
      this.coinGroup,
      this.resourceSystem,
    );

    this.combatSystem = new CombatSystem(this.projectileGroup);

    this.cameras.main.setBounds(0, 0, W, H);
    this.cameras.main.startFollow(
      this.player,
      true,
      GAME_CONFIG.camera.lerpX,
      GAME_CONFIG.camera.lerpY,
    );

    this.inventoryKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.scene.launch('UIScene');
  }

  update(time: number, delta: number) {
    // Don't process game input while inventory is open.
    if (this.scene.isActive('InventoryScene')) return;

    this.inputSystem.update();

    // Open inventory.
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.scene.launch('InventoryScene', {
        inventorySystem: this.inventorySystem,
        player: this.player,
      });
      this.scene.pause();
      return;
    }

    if (this.inputSystem.wasLMBPressed()) {
      const wp = this.inputSystem.getWorldPointer();
      this.player.fireSlot(1, wp.x, wp.y, this.projectileGroup);
    }
    if (this.inputSystem.wasRMBPressed()) {
      const wp = this.inputSystem.getWorldPointer();
      this.player.fireSlot(2, wp.x, wp.y, this.projectileGroup);
    }

    if (this.inputSystem.wasPressed('interact')) {
      this.chest.tryInteract(this.player, this.inventorySystem, time);
    }

    this.player.update(time, delta);
    this.combatSystem.update(time, delta);
    this.enemySpawner.update(time, delta);
  }

  getPlayerPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  getDropSystem(): DropSystem {
    return this.dropSystem;
  }

  isNearChest(): boolean {
    if (this.chest.opened) return false;
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y, this.chest.x, this.chest.y,
    );
    return dist <= GAME_CONFIG.chest.interactRange;
  }
}
