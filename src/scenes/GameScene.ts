import Phaser from "phaser";
import { COLORS } from "../config";
import { Backdrop } from "../gfx/Backdrop";
import { Player } from "../entities/Player";
import { Resonance } from "../gfx/Resonance";
import { Guardian } from "../entities/Guardian";
import { FIRST_ECHO, LevelData, PlatformDef, SeedDef, StoryZone } from "../levels/FirstEcho";

/** A seed in the world, with its collection state and sub-objects. */
interface LiveSeed {
  core: Phaser.GameObjects.Image;
  parts: Phaser.GameObjects.Image[];
  x: number;
  y: number;
  line: string;
  collected: boolean;
}

/**
 * The playable level "The First Echo". Reads its layout, seeds, story beats,
 * and guardian from level data (src/levels/FirstEcho.ts). Platforms are
 * static physics images; everything else is cosmetic/trigger-based.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelData;
  private backdrop!: Backdrop;
  private player!: Player;
  private platformBodies: Phaser.Physics.Arcade.Image[] = [];
  private seeds: LiveSeed[] = [];
  private seedsCollected = 0;
  private totalSeeds = 0;
  private guardian!: Guardian;
  private resonance!: Resonance;

  private storyZones: (StoryZone & { fired: boolean })[] = [];
  private finished = false;

  private WORLD_W = 6200;
  private WORLD_H = 1600;

  constructor() {
    super("Game");
  }

  create() {
    this.level = FIRST_ECHO;
    this.WORLD_W = this.level.worldW;
    this.WORLD_H = this.level.worldH;
    this.finished = false;
    this.seeds = [];
    this.platformBodies = [];
    this.seedsCollected = 0;

    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    // "The Hush": desaturate + dim the world so colour-restoration reads.
    const camFx = this.cameras.main as unknown as {
      postFX?: { addColorMatrix: () => { saturate: (v: number) => void; brightness: (v: number) => void } };
    };
    if (camFx.postFX && this.game.renderer.type === Phaser.WEBGL) {
      const cm = camFx.postFX.addColorMatrix();
      cm.saturate(-0.45);
      cm.brightness(0.94);
    }

    this.backdrop = new Backdrop(this, this.WORLD_W, this.level.groundY);
    this.buildLevel();
    this.spawnAmbientMotes();
    this.spawnFireflies();
    this.createForeground();

    this.resonance = new Resonance(this, this.WORLD_W, this.WORLD_H);
    this.player.onHum = (hx, hy) => this.resonance.pulse(hx, hy, 1.1);

    // Idle resonance hum
    this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => {
        if (!this.finished) this.resonance.pulse(this.player.x, this.player.y, 0.55);
      },
    });

    // Camera follow
    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.08, 0.08);
    cam.setZoom(1.5);
    cam.setDeadzone(160, 110);
    const zoom = Number(new URLSearchParams(window.location.search).get("zoom"));
    if (zoom > 0) {
      cam.setZoom(zoom);
      cam.setDeadzone(0, 0);
    }

    this.scene.launch("UI");
    // Emit the initial count after UI's create() has run and subscribed.
    this.time.delayedCall(0, () => this.events.emit("seeds", this.seedsCollected, this.totalSeeds));

    const skip = new URLSearchParams(window.location.search).has("play");
    if (!skip) {
      this.cameras.main.fadeIn(1200, 2, 4, 8);
    }

    // Intro narration (unless skipping via ?play)
    if (!skip) {
      this.time.delayedCall(900, () => this.events.emit("narrate", this.level.intro, 2600));
    }

    // Dev aid: pre-paint resonance so the effect shows in a static shot.
    if (new URLSearchParams(window.location.search).has("restore")) {
      for (let dx = -340; dx <= 340; dx += 28) this.resonance.update(this.level.spawn.x + dx, this.level.spawn.y);
      this.resonance.pulse(this.level.spawn.x, this.level.spawn.y - 14, 1.4);
    }

    // Dev aid: "?win" collects all seeds and drops Lumi by the guardian to
    // verify the reawakening + ending chain without a full playthrough.
    if (new URLSearchParams(window.location.search).has("win")) {
      for (const s of this.seeds) if (!s.collected) this.collectSeed(s);
      this.player.sprite.setPosition(this.guardian.x - 120, this.level.groundY - 16);
    }
  }

  // ============ LEVEL CONSTRUCTION ============

  private buildLevel() {
    for (const p of this.level.platforms) this.addPlatform(p);

    this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
    for (const body of this.platformBodies) {
      this.physics.add.collider(this.player.sprite, body);
    }

    for (const s of this.level.seeds) this.addSeed(s);
    this.totalSeeds = this.seeds.length;

    this.guardian = new Guardian(this, this.level.guardian.x, this.level.guardian.y);

    this.storyZones = this.level.storyZones.map((z) => ({ ...z, fired: false }));
  }

  private addPlatform(p: PlatformDef) {
    const key = `plat_${p.w}x${p.h}`;
    if (!this.textures.exists(key)) this.buildPlatformTexture(key, p.w, p.h);

    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const img = this.physics.add.staticImage(cx, cy, key);
    img.setDepth(10);
    const body = img.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(p.w, p.h);
    body.setOffset(0, 0);
    body.position.x = cx - p.w / 2;
    body.position.y = cy - p.h / 2;
    body.updateFromGameObject();
    this.platformBodies.push(img);

    this.add
      .image(p.x + p.w / 2, p.y + 1, "glow-green")
      .setDisplaySize(p.w * 1.02, 34)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9);

    const moss = this.add
      .tileSprite(p.x, p.y - 6, p.w, 16, "moss-edge")
      .setOrigin(0, 0)
      .setDepth(13)
      .setAlpha(0.9);
    this.tweens.add({ targets: moss, alpha: 0.7, duration: 2600 + Math.random() * 1200, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    this.decoratePlatform(p);
  }

  private buildPlatformTexture(key: string, w: number, h: number) {
    const tex = this.textures.createCanvas(key, w, h);
    if (!tex) return;
    const c = tex.getContext();
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(26,42,60,1)");
    g.addColorStop(0.12, "rgba(18,30,46,1)");
    g.addColorStop(1, "rgba(6,12,22,1)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(4,9,16,0.7)";
    c.lineWidth = 1.4;
    const rowH = 34;
    for (let ry = 10; ry < h; ry += rowH) {
      c.beginPath(); c.moveTo(0, ry); c.lineTo(w, ry); c.stroke();
      const off = ((ry / rowH) % 2) * 46;
      for (let bx = off; bx < w; bx += 92) {
        c.beginPath(); c.moveTo(bx, ry); c.lineTo(bx, Math.min(h, ry + rowH)); c.stroke();
      }
    }
    c.strokeStyle = "rgba(60,90,120,0.18)";
    c.lineWidth = 1;
    for (let ry = 10; ry < h; ry += rowH) {
      c.beginPath(); c.moveTo(0, ry + 1.5); c.lineTo(w, ry + 1.5); c.stroke();
    }
    for (let i = 0; i < w * h * 0.012; i++) {
      const x = Math.random() * w;
      const y = 6 + Math.random() * (h - 6);
      c.fillStyle = Math.random() > 0.6 ? `rgba(70,100,130,${0.08 + Math.random() * 0.12})` : `rgba(2,6,12,${0.15 + Math.random() * 0.2})`;
      c.fillRect(x, y, 1.6, 1.6);
    }
    const lip = c.createLinearGradient(0, 0, 0, 7);
    lip.addColorStop(0, "rgba(70,120,110,0.9)");
    lip.addColorStop(1, "rgba(30,60,70,0)");
    c.fillStyle = lip;
    c.fillRect(0, 0, w, 7);
    c.fillStyle = "rgba(140,230,200,0.5)";
    c.fillRect(0, 0, w, 1.5);
    tex.refresh();
  }

  private decoratePlatform(p: PlatformDef) {
    if (p.w < 100) return;
    const topY = p.y + 2;
    const count = Math.floor(p.w / 70);
    if (p.w > 140) {
      this.add.image(p.x + p.w / 2, topY, "moss").setOrigin(0.5, 1).setDisplaySize(p.w * 0.9, 12).setDepth(11).setAlpha(0.7);
    }
    for (let i = 0; i < count; i++) {
      const x = p.x + 30 + Math.random() * (p.w - 60);
      const roll = Math.random();
      if (roll < 0.35) {
        this.add.image(x, topY, "grass").setOrigin(0.5, 1).setDepth(11).setScale(0.6 + Math.random() * 0.5).setAlpha(0.75);
      } else if (roll < 0.6) {
        const mKeys = ["mush-cyan", "mush-blue", "mush-purple"];
        const glowKeys = ["glow-cyan", "glow-blue", "glow-purple"];
        const idx = Math.floor(Math.random() * 3);
        const m = this.add.image(x, topY, mKeys[idx]).setOrigin(0.5, 1).setDepth(12).setScale(0.6 + Math.random() * 0.5);
        const halo = this.add.image(x, topY - m.displayHeight * 0.4, glowKeys[idx]).setDisplaySize(60, 60).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
        this.tweens.add({ targets: halo, alpha: 0.1, duration: 1800 + Math.random() * 1800, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else if (roll < 0.8) {
        const cKeys = ["crystal-cyan", "crystal-blue", "crystal-purple"];
        const glowKeys = ["glow-cyan", "glow-blue", "glow-purple"];
        const idx = Math.floor(Math.random() * 3);
        const cr = this.add.image(x, topY, cKeys[idx]).setOrigin(0.5, 1).setDepth(12).setScale(0.6 + Math.random() * 0.5);
        const halo = this.add.image(x, topY - cr.displayHeight * 0.4, glowKeys[idx]).setDisplaySize(50, 50).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(11);
        this.tweens.add({ targets: halo, alpha: 0.12, scale: 1.15, duration: 1600 + Math.random() * 1600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      } else {
        const fKeys = ["flower-cyan", "flower-purple"];
        this.add.image(x, topY, fKeys[Math.floor(Math.random() * 2)]).setOrigin(0.5, 1).setDepth(12).setScale(0.7 + Math.random() * 0.5).setAlpha(0.85);
      }
    }
    if (p.w > 180 && Math.random() > 0.3) {
      const vc = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < vc; i++) {
        const x = p.x + 30 + Math.random() * (p.w - 60);
        this.add.image(x, p.y + p.h, "vine-glow").setOrigin(0.5, 0).setDepth(8).setScale(0.7 + Math.random() * 0.5).setAlpha(0.7);
      }
    }
  }

  private addSeed(def: SeedDef) {
    const { x, y } = def;
    const haloOuter = this.add.image(x, y, "glow-cyan").setDisplaySize(130, 130).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(14);
    const haloInner = this.add.image(x, y, "glow").setDisplaySize(66, 66).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD).setDepth(14);
    const core = this.add.image(x, y, "seed-core").setDisplaySize(34, 34).setDepth(15);

    this.tweens.add({ targets: [core, haloOuter, haloInner], y: y - 9, duration: 2200, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.tweens.add({ targets: core, angle: 360, duration: 9000, repeat: -1, ease: "Linear" });
    this.tweens.add({ targets: haloOuter, alpha: 0.16, scale: haloOuter.scale * 1.15, duration: 1600, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    this.tweens.add({ targets: haloInner, alpha: 0.28, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    const orbits: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < 2; i++) {
      const sp = this.add.image(x, y, "spark").setDisplaySize(i === 0 ? 9 : 6, i === 0 ? 9 : 6).setTint(COLORS.seedGlow).setBlendMode(Phaser.BlendModes.ADD).setDepth(15);
      orbits.push(sp);
      const rad = i === 0 ? 22 : 15;
      const dur = i === 0 ? 2600 : 1800;
      const dir = i === 0 ? 1 : -1;
      const ph = i * Math.PI;
      this.tweens.add({
        targets: { a: 0 }, a: Math.PI * 2, duration: dur, repeat: -1,
        onUpdate: (tw: Phaser.Tweens.Tween) => {
          const v = (tw.getValue() as number) * dir + ph;
          sp.setPosition(core.x + Math.cos(v) * rad, core.y + Math.sin(v) * rad * 0.7);
        },
      });
    }

    this.seeds.push({ core, parts: [haloOuter, haloInner, ...orbits], x, y, line: def.line, collected: false });
  }

  private spawnAmbientMotes() {
    const airTop = 500;
    const airBot = this.level.groundY - 10;
    this.add.particles(0, 0, "spore", {
      x: { min: 0, max: this.WORLD_W }, y: { min: airTop, max: airBot },
      lifespan: 8000, speedY: { min: -12, max: -3 }, speedX: { min: -6, max: 6 },
      scale: { min: 0.4, max: 1.2 },
      alpha: { values: [0, 0.5, 0.5, 0], interpolation: "linear" },
      frequency: 80, quantity: 2, blendMode: Phaser.BlendModes.ADD,
      tint: [COLORS.glowCyan, COLORS.glowBlue, COLORS.glowGreen],
    }).setDepth(13);
    this.add.particles(0, 0, "dust", {
      x: { min: 0, max: this.WORLD_W }, y: { min: airTop, max: airBot },
      lifespan: 6000, speedY: { min: -10, max: -2 }, speedX: { min: -5, max: 5 },
      scale: { min: 0.2, max: 0.5 },
      alpha: { values: [0, 0.35, 0.35, 0], interpolation: "linear" },
      frequency: 200, quantity: 1, blendMode: Phaser.BlendModes.ADD,
      tint: [COLORS.glowPurple, COLORS.glowCyan],
    }).setDepth(13);
  }

  private spawnFireflies() {
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * this.WORLD_W;
      const y = 520 + Math.random() * 700;
      const fly = this.add.image(x, y, "firefly").setDisplaySize(10, 10).setDepth(17).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.9);
      const wander = () => {
        this.tweens.add({ targets: fly, x: fly.x + (Math.random() - 0.5) * 220, y: fly.y + (Math.random() - 0.5) * 160, duration: 2600 + Math.random() * 2600, ease: "Sine.inOut", onComplete: wander });
      };
      wander();
      this.tweens.add({ targets: fly, alpha: 0.15, duration: 900 + Math.random() * 1400, yoyo: true, repeat: -1, ease: "Sine.inOut", delay: Math.random() * 1500 });
    }
  }

  private createForeground() {
    const groundY = this.level.groundY;
    const span = this.WORLD_W + 1200;
    for (let x = -300; x < span; x += 760 + Math.random() * 620) {
      const sc = 1.6 + Math.random() * 1.1;
      const img = this.add
        .image(x, groundY + 8, "grass")
        .setOrigin(0.5, 1)
        .setDepth(26)
        .setScale(sc)
        .setTint(0x0a1626)
        .setAlpha(0.85)
        .setScrollFactor(1.16, 1);
      if (Math.random() > 0.5) img.setFlipX(true);
    }
  }

  // ============ UPDATE / INTERACTIONS ============

  update(time: number, delta: number) {
    this.player.update(time, delta);
    const cam = this.cameras.main;
    this.backdrop.update(cam.scrollX, cam.scrollY);
    this.resonance.update(this.player.x, this.player.y);

    const px = this.player.x;
    const py = this.player.y;

    // Seeds
    for (const s of this.seeds) {
      if (!s.collected && Phaser.Math.Distance.Between(px, py, s.x, s.y) < 48) {
        this.collectSeed(s);
      }
    }

    // Story zones (fire once as Lumi passes)
    for (const z of this.storyZones) {
      if (!z.fired && px >= z.x) {
        z.fired = true;
        this.events.emit("narrate", [z.text], 3200);
      }
    }

    // Guardian — reawaken only with all seeds, then win
    if (!this.finished && this.seedsCollected >= this.totalSeeds && this.guardian.distanceTo(px, py) < 150) {
      this.winSequence();
    }

    // Safety: if Lumi falls into the chasm, respawn at spawn
    if (py > this.WORLD_H - 40) {
      this.player.sprite.setPosition(this.level.spawn.x, this.level.spawn.y - 40);
      (this.player.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.cameras.main.flash(200, 10, 20, 40);
    }
  }

  private collectSeed(s: LiveSeed) {
    s.collected = true;
    this.seedsCollected++;
    this.events.emit("seeds", this.seedsCollected, this.totalSeeds);
    this.events.emit("narrate", [s.line], 2800);

    this.add.particles(s.x, s.y, "spark", {
      lifespan: 700, speed: { min: 50, max: 200 }, scale: { start: 1, end: 0 }, alpha: { start: 1, end: 0 },
      tint: [COLORS.seedGlow, 0xffffff], blendMode: Phaser.BlendModes.ADD, emitting: false,
    }).explode(26);
    this.resonance.pulse(s.x, s.y, 1.4);

    const all = [s.core, ...s.parts];
    this.tweens.add({ targets: all, scale: 0, alpha: 0, duration: 240, onComplete: () => all.forEach((o) => o.destroy()) });
    this.cameras.main.flash(140, 70, 110, 150);
  }

  private winSequence() {
    this.finished = true;
    this.guardian.reawaken();
    this.resonance.pulse(this.guardian.x, this.guardian.y - 90, 2.4);

    // A big sweep of restoration out from the guardian
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 220, () => this.resonance.pulse(this.guardian.x, this.guardian.y - 90, 1.6));
    }

    // Outro narration, then fade to the ending screen
    this.time.delayedCall(1800, () => this.events.emit("narrate", this.level.outro, 3400));
    const outroMs = 1800 + this.level.outro.length * 3400 + 1200;
    this.time.delayedCall(outroMs, () => {
      this.cameras.main.fadeOut(2000, 2, 4, 8);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop("UI");
        this.scene.start("Ending");
      });
    });
  }
}
