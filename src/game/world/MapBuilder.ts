import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class MapBuilder {
  build(scene: Phaser.Scene): Phaser.Physics.Arcade.StaticGroup {
    const { width: W, height: H } = GAME_CONFIG.world;
    const obstacleGroup = scene.physics.add.staticGroup();

    this.buildBackground(scene, W, H);
    this.buildBorderWalls(scene, obstacleGroup, W, H);
    this.buildDecoration(scene, W, H);
    this.buildObstacles(scene, obstacleGroup, W, H);

    return obstacleGroup;
  }

  private buildBackground(scene: Phaser.Scene, W: number, H: number) {
    const bg = scene.add.graphics();
    bg.setDepth(-10);

    // Dark ground base.
    bg.fillStyle(0x1a2a1a);
    bg.fillRect(0, 0, W, H);

    // Subtle grid of darker patches for visual texture.
    bg.fillStyle(0x162216, 1);
    const patchSize = 200;
    for (let x = 0; x < W; x += patchSize) {
      for (let y = 0; y < H; y += patchSize) {
        if ((x + y) % (patchSize * 2) === 0) {
          bg.fillRect(x, y, patchSize, patchSize);
        }
      }
    }

    // Ruin accent lines scattered across the map.
    bg.lineStyle(2, 0x2a3a2a, 0.5);
    const lineCount = 60;
    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-seed']);
    for (let i = 0; i < lineCount; i++) {
      const lx = rng.between(100, W - 100);
      const ly = rng.between(100, H - 100);
      const len = rng.between(40, 160);
      const angle = rng.realInRange(0, Math.PI);
      bg.strokeLineShape(
        new Phaser.Geom.Line(
          lx, ly,
          lx + Math.cos(angle) * len,
          ly + Math.sin(angle) * len,
        ),
      );
    }
  }

  private buildBorderWalls(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    W: number,
    H: number,
  ) {
    const T = 64; // wall thickness
    // Invisible physics walls around the perimeter.
    this.addInvisibleWall(scene, group, W / 2, -T / 2, W + T * 2, T);  // top
    this.addInvisibleWall(scene, group, W / 2, H + T / 2, W + T * 2, T); // bottom
    this.addInvisibleWall(scene, group, -T / 2, H / 2, T, H + T * 2);  // left
    this.addInvisibleWall(scene, group, W + T / 2, H / 2, T, H + T * 2); // right
  }

  private addInvisibleWall(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const wall = scene.add.rectangle(x, y, w, h, 0x000000, 0);
    scene.physics.add.existing(wall, true);
    group.add(wall);
  }

  private buildDecoration(scene: Phaser.Scene, W: number, H: number) {
    // Visual-only terrain marks (no physics). Drawn as graphics shapes.
    const gfx = scene.add.graphics();
    gfx.setDepth(-9);

    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-deco']);

    // Dark ruin rectangles (visual only).
    for (let i = 0; i < 30; i++) {
      const x = rng.between(200, W - 200);
      const y = rng.between(200, H - 200);
      const skipCX = Math.abs(x - W / 2) < 350;
      const skipCY = Math.abs(y - H / 2) < 350;
      if (skipCX && skipCY) continue;

      gfx.lineStyle(2, 0x3a4a3a, 0.7);
      gfx.strokeRect(x, y, rng.between(60, 180), rng.between(20, 60));
    }

    // Scattered ground marks.
    gfx.fillStyle(0x142114, 0.5);
    for (let i = 0; i < 80; i++) {
      const x = rng.between(50, W - 50);
      const y = rng.between(50, H - 50);
      const r = rng.between(8, 24);
      gfx.fillCircle(x, y, r);
    }
  }

  private buildObstacles(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    W: number,
    H: number,
  ) {
    const cellSize = 400;
    const cols = Math.floor(W / cellSize);
    const rows = Math.floor(H / cellSize);
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);
    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-obs']);

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        // Leave a 3×3 clear zone around the player spawn / chest area.
        if (Math.abs(col - centerCol) <= 1 && Math.abs(row - centerRow) <= 1) continue;

        const count = rng.between(0, 2);
        for (let i = 0; i < count; i++) {
          const x = col * cellSize + rng.between(60, cellSize - 60);
          const y = row * cellSize + rng.between(60, cellSize - 60);
          this.placeObstacle(scene, group, x, y, rng);
        }
      }
    }
  }

  private placeObstacle(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
    rng: Phaser.Math.RandomDataGenerator,
  ) {
    const type = rng.between(0, 2);

    if (type === 0) {
      // Rock: gray tinted obstacle sprite.
      const sprite = scene.add.image(x, y, 'obstacle');
      sprite.setTint(0x778877);
      sprite.setScale(0.7 + rng.realInRange(0, 0.5));
      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(18, 6, 6);
      group.add(sprite);
    } else if (type === 1) {
      // Ruins wall: dark elongated rectangle.
      const rw = rng.between(40, 130);
      const rh = rng.between(16, 44);
      const rect = scene.add.rectangle(x, y, rw, rh, 0x4a3a2a);
      scene.physics.add.existing(rect, true);
      group.add(rect);
    } else {
      // Tree: green tinted obstacle sprite.
      const sprite = scene.add.image(x, y, 'obstacle');
      sprite.setTint(0x2a5a1a);
      sprite.setScale(0.9 + rng.realInRange(0, 0.4));
      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(20, 4, 4);
      group.add(sprite);
    }
  }
}
