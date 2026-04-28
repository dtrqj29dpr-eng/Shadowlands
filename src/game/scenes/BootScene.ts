import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this.generateTextures();
    this.scene.start('GameScene');
  }

  private generateTextures() {
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // ── Player (48×48) ───────────────────────────────────────────
    // Cloaked dark-fantasy warrior. Sprite rotates to face cursor;
    // the "front" (direction arrow + eyes) is on the RIGHT side.
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillEllipse(26, 44, 38, 10);               // ground shadow

    gfx.fillStyle(0x0c0c1e);
    gfx.fillCircle(24, 24, 21);                    // cloak outer
    gfx.fillStyle(0x131328);
    gfx.fillCircle(24, 24, 17);                    // cloak mid
    gfx.fillStyle(0x1c1c38);
    gfx.fillCircle(24, 23, 13);                    // hood inner

    gfx.fillStyle(0x344455);
    gfx.fillCircle(12, 27, 7);                     // left shoulder plate
    gfx.fillCircle(36, 27, 7);                     // right shoulder plate
    gfx.fillStyle(0x445566);
    gfx.fillCircle(12, 26, 5);                     // shoulder highlight
    gfx.fillCircle(36, 26, 5);

    gfx.fillStyle(0x1e1e44);
    gfx.fillCircle(24, 23, 9);                     // chest core

    // Glowing eyes (on the right / front side of sprite)
    gfx.fillStyle(0x00ffee, 0.25);
    gfx.fillCircle(30, 21, 5);                     // left eye halo
    gfx.fillCircle(36, 21, 5);                     // right eye halo
    gfx.fillStyle(0x00eedd);
    gfx.fillCircle(30, 21, 2.5);
    gfx.fillCircle(36, 21, 2.5);
    gfx.fillStyle(0x88ffee);
    gfx.fillCircle(30, 20, 1);                     // specular on eye
    gfx.fillCircle(36, 20, 1);

    // Direction indicator pointing right
    gfx.fillStyle(0x9abaff, 0.9);
    gfx.fillTriangle(46, 24, 36, 18, 36, 30);

    // Cloak outline
    gfx.lineStyle(1.5, 0x2244aa, 0.6);
    gfx.strokeCircle(24, 24, 21);

    gfx.generateTexture('player', 48, 48);
    gfx.clear();

    // ── Slime (36×30) ─────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillEllipse(18, 27, 30, 8);               // ground shadow

    gfx.fillStyle(0x228833);
    gfx.fillEllipse(18, 15, 34, 26);              // dark edge
    gfx.fillStyle(0x33dd44);
    gfx.fillEllipse(18, 14, 30, 22);              // main body
    gfx.fillStyle(0x55ee66, 0.7);
    gfx.fillEllipse(16, 9, 22, 12);              // highlight band
    gfx.fillStyle(0xbbffcc);
    gfx.fillCircle(11, 7, 4);                     // shine patch
    gfx.fillStyle(0xffffff, 0.85);
    gfx.fillCircle(10, 6, 2);                     // specular

    // Left eye
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(10, 13, 4);
    gfx.fillStyle(0x0a0a0a);
    gfx.fillCircle(11, 14, 2.5);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(12, 13, 1);

    // Right eye
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(24, 13, 4);
    gfx.fillStyle(0x0a0a0a);
    gfx.fillCircle(25, 14, 2.5);
    gfx.fillStyle(0xffffff);
    gfx.fillCircle(26, 13, 1);

    // Mouth
    gfx.lineStyle(1.5, 0x1a7730, 0.9);
    gfx.strokeLineShape(new Phaser.Geom.Line(12, 20, 22, 20));

    gfx.generateTexture('slime', 36, 30);
    gfx.clear();

    // ── Sword Projectile (32×10) ──────────────────────────────────
    // Handle
    gfx.fillStyle(0x3a1f08);
    gfx.fillRect(0, 1, 8, 8);
    gfx.fillStyle(0x5a3010);
    gfx.fillRect(0, 2, 8, 6);
    // Grip wrapping lines
    gfx.lineStyle(1, 0x7a5030, 0.8);
    gfx.strokeLineShape(new Phaser.Geom.Line(2, 1, 2, 9));
    gfx.strokeLineShape(new Phaser.Geom.Line(5, 1, 5, 9));
    // Guard crosspiece
    gfx.fillStyle(0x3a3a3a);
    gfx.fillRect(8, 0, 3, 10);
    gfx.fillStyle(0x5a5a5a);
    gfx.fillRect(8, 2, 3, 6);
    // Blade
    gfx.fillStyle(0x999988);
    gfx.fillRect(11, 2, 18, 6);
    gfx.fillStyle(0xccccbb);
    gfx.fillRect(11, 2, 18, 3);                  // blade top half (lighter)
    // Blade tip (triangle)
    gfx.fillStyle(0xaaaaaa);
    gfx.fillTriangle(29, 2, 32, 5, 29, 8);
    gfx.fillStyle(0xccccbb);
    gfx.fillTriangle(29, 2, 32, 5, 29, 4);
    // Edge specular
    gfx.lineStyle(1, 0xffffff, 0.45);
    gfx.strokeLineShape(new Phaser.Geom.Line(11, 2, 29, 2));

    gfx.generateTexture('sword-projectile', 32, 10);
    gfx.clear();

    // ── Chest Closed (48×42) ──────────────────────────────────────
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillEllipse(26, 40, 44, 10);             // shadow

    // Body (bottom 55%)
    gfx.fillStyle(0x6a3a14);
    gfx.fillRect(2, 20, 44, 20);
    gfx.fillStyle(0x8b5a2b);
    gfx.fillRect(3, 22, 42, 17);
    // Wood grain on body
    gfx.lineStyle(1, 0x7a4a1a, 0.5);
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 27, 45, 27));
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 32, 45, 32));
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 37, 45, 37));

    // Lid (top 45%)
    gfx.fillStyle(0x5a3010);
    gfx.fillRect(2, 2, 44, 18);
    gfx.fillStyle(0x6f4018);
    gfx.fillRect(3, 3, 42, 16);
    // Wood grain on lid
    gfx.lineStyle(1, 0x5a3010, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 9, 45, 9));
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 14, 45, 14));

    // Metal straps
    gfx.fillStyle(0x4a4535);
    gfx.fillRect(12, 2, 6, 38);
    gfx.fillRect(30, 2, 6, 38);
    gfx.fillStyle(0x6a6550);
    gfx.fillRect(13, 2, 4, 38);
    gfx.fillRect(31, 2, 4, 38);
    gfx.lineStyle(1, 0x3a3525, 0.8);
    gfx.strokeRect(12, 2, 6, 38);
    gfx.strokeRect(30, 2, 6, 38);

    // Metal corner reinforcements
    gfx.fillStyle(0x5a5545);
    gfx.fillRect(2, 2, 9, 7);
    gfx.fillRect(37, 2, 9, 7);
    gfx.fillRect(2, 33, 9, 7);
    gfx.fillRect(37, 33, 9, 7);
    gfx.fillStyle(0x7a7565);
    gfx.fillRect(3, 3, 7, 5);
    gfx.fillRect(38, 3, 7, 5);
    gfx.fillRect(3, 34, 7, 5);
    gfx.fillRect(38, 34, 7, 5);

    // Latch
    gfx.fillStyle(0x333322);
    gfx.fillCircle(24, 20, 7);
    gfx.fillStyle(0xeeaa00);
    gfx.fillCircle(24, 20, 5);
    gfx.fillStyle(0xffee66);
    gfx.fillCircle(22, 18, 2);                   // latch shine
    gfx.fillStyle(0x111100);
    gfx.fillCircle(24, 20, 2);                   // keyhole circle
    gfx.fillRect(23, 20, 2, 4);                  // keyhole slot

    // Chest outline
    gfx.lineStyle(1.5, 0x1a0a00);
    gfx.strokeRect(2, 2, 44, 38);

    gfx.generateTexture('chest-closed', 48, 42);
    gfx.clear();

    // ── Chest Open (48×42) ────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillEllipse(26, 40, 44, 10);

    // Body (same)
    gfx.fillStyle(0x6a3a14);
    gfx.fillRect(2, 20, 44, 20);
    gfx.fillStyle(0x8b5a2b);
    gfx.fillRect(3, 22, 42, 17);
    gfx.lineStyle(1, 0x7a4a1a, 0.5);
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 27, 45, 27));
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 32, 45, 32));
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 37, 45, 37));

    // Ambient glow spilling from open interior
    gfx.fillStyle(0xffee88, 0.12);
    gfx.fillCircle(24, 14, 32);

    // Interior glow
    gfx.fillStyle(0xffe090, 0.95);
    gfx.fillRect(4, 11, 40, 10);
    gfx.fillStyle(0xfffacc, 0.5);
    gfx.fillRect(6, 12, 36, 5);

    // Light rays rising from interior
    gfx.lineStyle(1.5, 0xffee88, 0.55);
    gfx.strokeLineShape(new Phaser.Geom.Line(12, 11, 7, 1));
    gfx.strokeLineShape(new Phaser.Geom.Line(24, 11, 24, 0));
    gfx.strokeLineShape(new Phaser.Geom.Line(36, 11, 41, 1));

    // Lid tilted back (narrow strip at top)
    gfx.fillStyle(0x5a3010);
    gfx.fillRect(2, 2, 44, 9);
    gfx.fillStyle(0x6f4018);
    gfx.fillRect(3, 3, 42, 7);
    gfx.lineStyle(1, 0x5a3010, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(3, 7, 45, 7));

    // Metal straps + corners (same as closed)
    gfx.fillStyle(0x4a4535);
    gfx.fillRect(12, 2, 6, 38);
    gfx.fillRect(30, 2, 6, 38);
    gfx.fillStyle(0x6a6550);
    gfx.fillRect(13, 2, 4, 38);
    gfx.fillRect(31, 2, 4, 38);
    gfx.fillStyle(0x5a5545);
    gfx.fillRect(2, 2, 9, 7);
    gfx.fillRect(37, 2, 9, 7);
    gfx.fillRect(2, 33, 9, 7);
    gfx.fillRect(37, 33, 9, 7);
    gfx.fillStyle(0x7a7565);
    gfx.fillRect(3, 3, 7, 5);
    gfx.fillRect(38, 3, 7, 5);
    gfx.fillRect(3, 34, 7, 5);
    gfx.fillRect(38, 34, 7, 5);

    gfx.lineStyle(1.5, 0x1a0a00);
    gfx.strokeRect(2, 2, 44, 38);

    gfx.generateTexture('chest-open', 48, 42);
    gfx.clear();

    // ── Coin (18×18) ─────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.2);
    gfx.fillEllipse(10, 16, 14, 5);              // shadow

    gfx.fillStyle(0xaa7700);
    gfx.fillCircle(9, 9, 8);                     // dark rim / depth
    gfx.fillStyle(0xeeaa00);
    gfx.fillCircle(9, 9, 7);                     // main gold
    gfx.fillStyle(0xffcc33, 0.8);
    gfx.fillEllipse(7, 7, 8, 6);                 // 3D highlight ellipse
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(6, 6, 2);                     // specular dot
    gfx.lineStyle(1.5, 0x885500);
    gfx.strokeCircle(9, 9, 8);                   // rim

    gfx.generateTexture('coin', 18, 18);
    gfx.clear();

    // ── Rock (52×52) ──────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillEllipse(28, 49, 42, 11);             // shadow

    gfx.fillStyle(0x4a5a48);
    gfx.fillCircle(28, 26, 22);                  // back mass
    gfx.fillStyle(0x667a64);
    gfx.fillCircle(24, 23, 20);                  // main rock
    gfx.fillStyle(0x5a6a58);
    gfx.fillCircle(32, 30, 15);                  // secondary chunk

    gfx.fillStyle(0x7a9078);
    gfx.fillCircle(17, 15, 10);                  // lit area
    gfx.fillStyle(0x8aaa88, 0.7);
    gfx.fillCircle(14, 12, 6);

    // Crack between chunks
    gfx.lineStyle(1.5, 0x3a4838, 0.9);
    gfx.strokeLineShape(new Phaser.Geom.Line(22, 14, 34, 32));
    gfx.lineStyle(1, 0x2a3828, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(20, 16, 28, 28));

    gfx.fillStyle(0x99aaaa);
    gfx.fillCircle(13, 11, 3);                   // specular

    gfx.generateTexture('rock', 52, 52);
    gfx.clear();

    // ── Tree (52×52) ──────────────────────────────────────────────
    gfx.fillStyle(0x000000, 0.3);
    gfx.fillEllipse(28, 50, 20, 6);             // shadow

    // Trunk
    gfx.fillStyle(0x2e1406);
    gfx.fillRect(22, 33, 8, 18);
    gfx.fillStyle(0x4a2a10);
    gfx.fillRect(23, 33, 4, 18);
    // Root stumps
    gfx.fillStyle(0x2e1406);
    gfx.fillRect(17, 46, 7, 4);
    gfx.fillRect(28, 46, 7, 4);

    // Canopy layers — dark at edges, lighter toward top highlight
    gfx.fillStyle(0x0a2808);
    gfx.fillCircle(26, 21, 22);
    gfx.fillStyle(0x154a0e);
    gfx.fillCircle(26, 19, 18);
    gfx.fillStyle(0x226614);
    gfx.fillCircle(26, 17, 13);
    gfx.fillStyle(0x348020);
    gfx.fillCircle(22, 12, 9);
    gfx.fillStyle(0x44a028, 0.7);
    gfx.fillCircle(20, 9, 5);
    gfx.fillStyle(0x70cc3a, 0.35);
    gfx.fillCircle(18, 8, 3);                    // top specular

    gfx.generateTexture('tree', 52, 52);
    gfx.clear();

    // ── Ground Shadow (64×16) — oval under obstacles ──────────────
    gfx.fillStyle(0x000000, 0.4);
    gfx.fillEllipse(32, 8, 60, 15);
    gfx.fillStyle(0x000000, 0.25);
    gfx.fillEllipse(32, 8, 50, 11);

    gfx.generateTexture('ground-shadow', 64, 16);
    gfx.clear();

    // ── Ruin Wall Tile (64×24) — tiling stone wall segment ────────
    gfx.fillStyle(0x3e3528);
    gfx.fillRect(0, 0, 64, 24);
    gfx.fillStyle(0x504538);
    gfx.fillRect(1, 1, 62, 22);

    // Brick rows
    gfx.lineStyle(1, 0x302820, 0.85);
    gfx.strokeLineShape(new Phaser.Geom.Line(0, 11, 64, 11));  // row divider

    // Brick vertical offsets — row 1 (offset 0)
    gfx.strokeLineShape(new Phaser.Geom.Line(20, 0, 20, 11));
    gfx.strokeLineShape(new Phaser.Geom.Line(42, 0, 42, 11));
    // Brick vertical offsets — row 2 (offset half-brick)
    gfx.strokeLineShape(new Phaser.Geom.Line(10, 11, 10, 24));
    gfx.strokeLineShape(new Phaser.Geom.Line(32, 11, 32, 24));
    gfx.strokeLineShape(new Phaser.Geom.Line(54, 11, 54, 24));

    // Chipped corners / damage marks
    gfx.fillStyle(0x2a2015);
    gfx.fillTriangle(0, 0, 5, 0, 0, 4);
    gfx.fillTriangle(64, 0, 59, 0, 64, 4);
    gfx.fillTriangle(0, 24, 5, 24, 0, 20);

    // Top edge highlight (light catching top of wall)
    gfx.fillStyle(0x706050, 0.5);
    gfx.fillRect(1, 1, 62, 2);

    gfx.generateTexture('ruin-wall', 64, 24);
    gfx.clear();

    // ── Artifact placeholder (32×32) — glowing diamond gem ────────
    gfx.fillStyle(0x3a1166, 1);
    gfx.fillTriangle(16, 2, 30, 16, 16, 30);       // right half of diamond
    gfx.fillTriangle(16, 2, 2, 16, 16, 30);         // left half of diamond
    gfx.fillStyle(0x7733cc, 0.9);
    gfx.fillTriangle(16, 4, 28, 16, 16, 28);
    gfx.fillTriangle(16, 4, 4, 16, 16, 28);
    gfx.fillStyle(0xaa66ee, 0.7);
    gfx.fillTriangle(16, 4, 28, 16, 16, 14);        // upper shine facet
    gfx.fillStyle(0xddaaff, 0.5);
    gfx.fillTriangle(13, 7, 19, 7, 16, 4);          // top specular
    gfx.lineStyle(1, 0x9944dd, 0.9);
    gfx.strokeTriangle(16, 2, 30, 16, 16, 30);
    gfx.strokeTriangle(16, 2, 2, 16, 16, 30);

    gfx.generateTexture('artifact', 32, 32);
    gfx.clear();

    // ── Wooden Log (32×20) ───────────────────────────────────────
    gfx.fillStyle(0x3a1a06);
    gfx.fillRect(0, 2, 32, 16);
    gfx.fillStyle(0x6a3a14);
    gfx.fillRect(1, 3, 30, 14);
    // End grain ring
    gfx.fillStyle(0x5a2e0e);
    gfx.fillEllipse(5, 10, 8, 14);
    gfx.fillStyle(0x8b5a2b, 0.8);
    gfx.fillEllipse(5, 10, 5, 10);
    gfx.fillStyle(0xaa7a3a, 0.5);
    gfx.fillEllipse(5, 10, 2, 6);
    // Wood grain lines
    gfx.lineStyle(1, 0x4a2208, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(10, 4, 31, 4));
    gfx.strokeLineShape(new Phaser.Geom.Line(10, 10, 31, 10));
    gfx.strokeLineShape(new Phaser.Geom.Line(10, 16, 31, 16));
    gfx.lineStyle(1, 0x3a1a06, 0.8);
    gfx.strokeRect(0, 2, 32, 16);

    gfx.generateTexture('wooden-log', 32, 20);
    gfx.clear();

    // ── Iron Bar (32×14) ─────────────────────────────────────────
    gfx.fillStyle(0x3a3a44);
    gfx.fillRect(0, 1, 32, 12);
    gfx.fillStyle(0x8899aa);
    gfx.fillRect(1, 2, 30, 10);
    // Metallic shine
    gfx.fillStyle(0xbbccdd, 0.7);
    gfx.fillRect(2, 2, 28, 4);
    gfx.fillStyle(0xddeeff, 0.4);
    gfx.fillRect(4, 2, 20, 2);
    // Shadow edge
    gfx.fillStyle(0x223344, 0.8);
    gfx.fillRect(1, 10, 30, 2);
    gfx.lineStyle(1, 0x223344, 0.9);
    gfx.strokeRect(0, 1, 32, 12);

    gfx.generateTexture('iron-bar', 32, 14);
    gfx.clear();

    // ── Iron Sword Projectile (32×10) ────────────────────────────
    // Handle (dark leather)
    gfx.fillStyle(0x1a1a2a);
    gfx.fillRect(0, 1, 8, 8);
    gfx.fillStyle(0x2a2a3a);
    gfx.fillRect(0, 2, 8, 6);
    gfx.lineStyle(1, 0x3a3a4a, 0.8);
    gfx.strokeLineShape(new Phaser.Geom.Line(2, 1, 2, 9));
    gfx.strokeLineShape(new Phaser.Geom.Line(5, 1, 5, 9));
    // Guard
    gfx.fillStyle(0x5a5a6a);
    gfx.fillRect(8, 0, 3, 10);
    gfx.fillStyle(0x8888aa);
    gfx.fillRect(8, 2, 3, 6);
    // Blade (brighter grey, more silver)
    gfx.fillStyle(0xaaaacc);
    gfx.fillRect(11, 2, 18, 6);
    gfx.fillStyle(0xccccee);
    gfx.fillRect(11, 2, 18, 3);
    // Tip
    gfx.fillStyle(0xbbbbcc);
    gfx.fillTriangle(29, 2, 32, 5, 29, 8);
    gfx.fillStyle(0xddddee);
    gfx.fillTriangle(29, 2, 32, 5, 29, 4);
    // Edge specular
    gfx.lineStyle(1, 0xffffff, 0.6);
    gfx.strokeLineShape(new Phaser.Geom.Line(11, 2, 29, 2));

    gfx.generateTexture('iron-sword', 32, 10);
    gfx.clear();

    gfx.destroy();
  }
}
