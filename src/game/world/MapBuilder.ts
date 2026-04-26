import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/GameConfig';

export class MapBuilder {
  build(scene: Phaser.Scene): Phaser.Physics.Arcade.StaticGroup {
    const { width: W, height: H } = GAME_CONFIG.world;
    const obstacleGroup = scene.physics.add.staticGroup();

    this.buildGround(scene, W, H);
    this.buildAtmosphere(scene, W, H);
    this.buildBorderWalls(scene, obstacleGroup, W, H);
    this.buildRuinDecoration(scene, W, H);
    this.buildObstacles(scene, obstacleGroup, W, H);

    return obstacleGroup;
  }

  // ── Ground ─────────────────────────────────────────────────────

  private buildGround(scene: Phaser.Scene, W: number, H: number) {
    const gfx = scene.add.graphics();
    gfx.setDepth(-10);

    // Base: dark shadow-forest floor
    gfx.fillStyle(0x0c160c);
    gfx.fillRect(0, 0, W, H);

    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-ground']);

    // Ground variation patches (lighter mid-tones)
    gfx.fillStyle(0x121e12);
    for (let i = 0; i < 180; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      const r = rng.between(60, 200);
      gfx.fillCircle(x, y, r);
    }

    // Darker pools / shadow areas
    gfx.fillStyle(0x080f08, 0.5);
    for (let i = 0; i < 80; i++) {
      const x = rng.between(0, W);
      const y = rng.between(0, H);
      gfx.fillCircle(x, y, rng.between(40, 120));
    }

    // Stone paved zones — 8 scattered spots
    gfx.fillStyle(0x161410, 0.85);
    for (let i = 0; i < 8; i++) {
      const px = rng.between(400, W - 400);
      const py = rng.between(400, H - 400);
      gfx.fillRect(px - 100, py - 100, 200, 200);
      // Paving grid lines
      gfx.lineStyle(1, 0x201c18, 0.5);
      for (let gx = px - 100; gx <= px + 100; gx += 40) {
        gfx.strokeLineShape(new Phaser.Geom.Line(gx, py - 100, gx, py + 100));
      }
      for (let gy = py - 100; gy <= py + 100; gy += 40) {
        gfx.strokeLineShape(new Phaser.Geom.Line(px - 100, gy, px + 100, gy));
      }
    }

    // Dirt path from center heading in 4 directions (looping overlapping circles)
    const pathColor = 0x1a1508;
    gfx.fillStyle(pathColor, 0.8);
    const pathDirs = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    ];
    for (const dir of pathDirs) {
      let px = W / 2;
      let py = H / 2;
      const totalLen = W * 0.35;
      for (let d = 40; d < totalLen; d += 35) {
        // Slight wander off the cardinal direction
        const wobble = Math.sin(d * 0.05) * 60;
        const wx = px + dir.dx * 35 + dir.dy * wobble;
        const wy = py + dir.dy * 35 + dir.dx * wobble;
        gfx.fillCircle(wx, wy, rng.between(28, 44));
        px = wx;
        py = wy;
      }
    }

    // Edge vignette — concentric very-dark rings near the map border
    const vingnetteLayers = [
      { shrink: 0, alpha: 0.55 },
      { shrink: 80, alpha: 0.4 },
      { shrink: 160, alpha: 0.25 },
      { shrink: 260, alpha: 0.12 },
    ];
    for (const v of vingnetteLayers) {
      const s = v.shrink;
      gfx.fillStyle(0x000000, v.alpha);
      gfx.fillRect(0, 0, W, s + 30);              // top
      gfx.fillRect(0, H - s - 30, W, s + 30);     // bottom
      gfx.fillRect(0, 0, s + 30, H);              // left
      gfx.fillRect(W - s - 30, 0, s + 30, H);     // right
    }
  }

  // ── Atmosphere ─────────────────────────────────────────────────

  private buildAtmosphere(scene: Phaser.Scene, W: number, H: number) {
    const gfx = scene.add.graphics();
    gfx.setDepth(-9);

    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-atm']);

    // Misty blue-gray fog patches
    gfx.fillStyle(0x0a0c18, 0.1);
    for (let i = 0; i < 30; i++) {
      const x = rng.between(200, W - 200);
      const y = rng.between(200, H - 200);
      gfx.fillCircle(x, y, rng.between(100, 260));
    }

    // Campfire glow spots — warm atmospheric light
    const campfires = 7;
    for (let i = 0; i < campfires; i++) {
      const fx = rng.between(500, W - 500);
      const fy = rng.between(500, H - 500);
      // Skip if near center spawn
      if (Math.abs(fx - W / 2) < 400 && Math.abs(fy - H / 2) < 400) continue;

      gfx.fillStyle(0xff4400, 0.08);
      gfx.fillCircle(fx, fy, 80);
      gfx.fillStyle(0xff6600, 0.1);
      gfx.fillCircle(fx, fy, 45);
      gfx.fillStyle(0xffaa00, 0.14);
      gfx.fillCircle(fx, fy, 22);
      gfx.fillStyle(0xffdd88, 0.25);
      gfx.fillCircle(fx, fy, 10);
    }

    // Subtle moss/lichen patches on ground
    gfx.fillStyle(0x1a3010, 0.35);
    for (let i = 0; i < 50; i++) {
      const x = rng.between(100, W - 100);
      const y = rng.between(100, H - 100);
      gfx.fillEllipse(x, y, rng.between(20, 60), rng.between(10, 30));
    }
  }

  // ── Border Walls ───────────────────────────────────────────────

  private buildBorderWalls(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    W: number,
    H: number,
  ) {
    const T = 64;
    this.addInvisibleWall(scene, group, W / 2, -T / 2, W + T * 2, T);
    this.addInvisibleWall(scene, group, W / 2, H + T / 2, W + T * 2, T);
    this.addInvisibleWall(scene, group, -T / 2, H / 2, T, H + T * 2);
    this.addInvisibleWall(scene, group, W + T / 2, H / 2, T, H + T * 2);
  }

  private addInvisibleWall(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number, y: number, w: number, h: number,
  ) {
    const wall = scene.add.rectangle(x, y, w, h, 0x000000, 0);
    scene.physics.add.existing(wall, true);
    group.add(wall);
  }

  // ── Ruin Decoration ────────────────────────────────────────────

  private buildRuinDecoration(scene: Phaser.Scene, W: number, H: number) {
    const gfx = scene.add.graphics();
    gfx.setDepth(-8);

    const rng = new Phaser.Math.RandomDataGenerator(['shadowlands-ruins']);

    // L-shaped and T-shaped ruin wall outlines
    const ruinCount = 18;
    for (let i = 0; i < ruinCount; i++) {
      const rx = rng.between(300, W - 300);
      const ry = rng.between(300, H - 300);

      // Skip center spawn area
      if (Math.abs(rx - W / 2) < 450 && Math.abs(ry - H / 2) < 450) continue;

      const type = rng.between(0, 2);
      const lineW = rng.between(60, 180);
      const lineH = rng.between(60, 160);

      gfx.lineStyle(3, 0x4a4030, 0.85);

      if (type === 0) {
        // L-shape
        gfx.strokeLineShape(new Phaser.Geom.Line(rx, ry, rx + lineW, ry));
        gfx.strokeLineShape(new Phaser.Geom.Line(rx, ry, rx, ry + lineH));
      } else if (type === 1) {
        // U-shape (open top)
        gfx.strokeLineShape(new Phaser.Geom.Line(rx, ry, rx, ry + lineH));
        gfx.strokeLineShape(new Phaser.Geom.Line(rx, ry + lineH, rx + lineW, ry + lineH));
        gfx.strokeLineShape(new Phaser.Geom.Line(rx + lineW, ry, rx + lineW, ry + lineH));
      } else {
        // Single thick wall fragment
        gfx.lineStyle(4, 0x4a4030, 0.8);
        gfx.strokeLineShape(new Phaser.Geom.Line(rx, ry, rx + lineW, ry + 10));
      }

      // Inner wall detail (thinner, slightly lighter)
      gfx.lineStyle(1, 0x6a6045, 0.5);
      if (type === 0) {
        gfx.strokeLineShape(new Phaser.Geom.Line(rx + 2, ry + 2, rx + lineW - 2, ry + 2));
        gfx.strokeLineShape(new Phaser.Geom.Line(rx + 2, ry + 2, rx + 2, ry + lineH - 2));
      }
    }

    // Floor mosaics / ancient markings
    gfx.lineStyle(1, 0x3a3020, 0.55);
    for (let i = 0; i < 12; i++) {
      const mx = rng.between(400, W - 400);
      const my = rng.between(400, H - 400);
      const r = rng.between(20, 50);
      // Diamond shape
      gfx.strokeLineShape(new Phaser.Geom.Line(mx, my - r, mx + r, my));
      gfx.strokeLineShape(new Phaser.Geom.Line(mx + r, my, mx, my + r));
      gfx.strokeLineShape(new Phaser.Geom.Line(mx, my + r, mx - r, my));
      gfx.strokeLineShape(new Phaser.Geom.Line(mx - r, my, mx, my - r));
    }
  }

  // ── Obstacles ──────────────────────────────────────────────────

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
      // Rock
      const shadow = scene.add.image(x, y + 18, 'ground-shadow');
      shadow.setDepth(-7);

      const sprite = scene.add.image(x, y, 'rock');
      sprite.setScale(0.75 + rng.realInRange(0, 0.4));
      sprite.setAngle(rng.between(-20, 20));
      sprite.setDepth(-6);

      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(14, 12, 12);
      group.add(sprite);

    } else if (type === 1) {
      // Ruin wall — use tiled ruin-wall image, scaled to desired dimensions
      const rw = rng.between(48, 128);
      const rh = 24;
      const scaleX = rw / 64;

      const sprite = scene.add.image(x, y, 'ruin-wall');
      sprite.setScale(scaleX, 1);
      sprite.setDepth(-6);

      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setSize(rw, rh);
      body.setOffset(0, 0);
      group.add(sprite);

    } else {
      // Tree
      const shadow = scene.add.image(x, y + 18, 'ground-shadow');
      shadow.setDepth(-7);

      const sprite = scene.add.image(x, y, 'tree');
      sprite.setScale(0.85 + rng.realInRange(0, 0.35));
      sprite.setDepth(-5);

      scene.physics.add.existing(sprite, true);
      const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
      body.setCircle(16, 10, 10);
      group.add(sprite);
    }
  }
}
