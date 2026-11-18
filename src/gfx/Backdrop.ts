import Phaser from "phaser";
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * Dark enchanted bioluminescent forest backdrop.
 * Layers (back → front):
 *   1. Near-black sky gradient
 *   2. Faint starfield
 *   3. Distant glow (moon-like light source)
 *   4. Rolling dark hill silhouettes
 *   5. Far trees (dark spires, barely visible)
 *   6. Fog band
 *   7. Mid trees (gnarled oaks with glowing moss) + giant ancients
 *   8. Fog band
 *   9. Volumetric light rays
 *  10. Near trees (twisted with luminous vines)
 *  11. Background bioluminescent flora (mushrooms, crystals, flowers)
 *  12. Fog band (close)
 */
export class Backdrop {
  private scene: Phaser.Scene;
  private worldW: number;
  private tiles: { img: Phaser.GameObjects.TileSprite; factor: number }[] = [];

  /** World-space Y of the main ground surface that decorations rest on. */
  private groundY: number;

  constructor(scene: Phaser.Scene, worldW = GAME_WIDTH, groundY = GAME_HEIGHT * 0.8) {
    this.scene = scene;
    this.worldW = worldW;
    this.groundY = groundY;
    this.build();
  }

  private build() {
    const s = this.scene;

    // 1. Sky — near-black gradient
    if (!s.textures.exists("skyGrad")) {
      const sky = s.textures.createCanvas("skyGrad", 2, GAME_HEIGHT);
      if (sky) {
        const ctx = sky.getContext();
        const g = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        g.addColorStop(0, this.hex(COLORS.skyTop));
        g.addColorStop(0.5, this.hex(COLORS.skyBottom));
        g.addColorStop(1, this.hex(COLORS.nearForest));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 2, GAME_HEIGHT); sky.refresh();
      }
    }
    s.add.image(0, 0, "skyGrad").setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setScrollFactor(0).setDepth(-100);

    // 2. Stars (very subtle)
    const stars = s.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "stars").setOrigin(0, 0).setScrollFactor(0).setDepth(-99).setAlpha(0.4);
    this.tiles.push({ img: stars, factor: 0.01 });

    // 3. Distant light source (soft cyan glow — like moonlight filtering through canopy)
    const moon = s.add.image(GAME_WIDTH * 0.65, GAME_HEIGHT * 0.2, "glow-cyan").setDisplaySize(300, 300).setAlpha(0.25).setScrollFactor(0.02).setDepth(-98).setBlendMode(Phaser.BlendModes.ADD);
    s.tweens.add({ targets: moon, alpha: 0.15, duration: 8000, yoyo: true, repeat: -1, ease: "Sine.inOut" });

    // Secondary purple glow
    s.add.image(GAME_WIDTH * 0.3, GAME_HEIGHT * 0.35, "glow-purple").setDisplaySize(400, 400).setAlpha(0.08).setScrollFactor(0.03).setDepth(-97).setBlendMode(Phaser.BlendModes.ADD);

    // All world-anchored decoration rests on (or just behind) the ground
    // line. Distant layers sit a bit higher so they read as "further back".
    const G = this.groundY;

    // 3b. Distant mountain ranges — their bases near the horizon.
    this.addMountainStrips("mountains-far", 0.06, G - 40, 420, -96, 0.6);
    this.addMountainStrips("mountains-near", 0.11, G - 24, 360, -93, 0.75);

    // 4. Hill ridgelines (screen-pinned atmosphere)
    this.addHillLayer(COLORS.farForest, 0.06, 0.52, 200, -92, 0.6);
    this.addHillLayer(COLORS.midForest, 0.14, 0.64, 160, -90, 0.7);

    // 5. Far trees — dark spires, slow parallax, slightly raised toward horizon
    this.scatter(["tree-far-0", "tree-far-1", "tree-far-2", "tree-dead-0"], [1, 1, 1, 0.3], -82, 0.12, G - 18, 180, 0.4, 0.65, 1.0, 0.7);

    // 6. Fog between far and mid (screen-pinned)
    this.addFog(GAME_HEIGHT * 0.6, -78, 0.2, 0.3, 48000);

    // 6b. Ancient ruins in the midground
    this.scatterRuins();

    // 7. Mid trees — gnarled, with moss glow
    this.scatter(["tree-mid-0", "tree-mid-1", "tree-mid-2", "tree-dead-1"], [1, 1, 1, 0.2], -68, 0.35, G - 8, 240, 0.6, 0.9, 1.5, 0.8);
    // Giant ancients (sparse)
    this.scatter(["tree-giant"], [1], -65, 0.38, G - 4, 850, 0.75, 1.0, 0.3, 0.85);

    // 8. Mid fog
    this.addFog(GAME_HEIGHT * 0.72, -60, 0.45, 0.35, 60000);

    // 9. Volumetric light rays — tall beams from above
    this.addLightRays();

    // 10. Near trees — twisted, planted right at the ground line
    this.scatter(["tree-near-0", "tree-near-1", "tree-near-2"], [1, 1, 1], -48, 0.65, G, 300, 0.85, 1.2, 2.0, 0.85);

    // 11. Background bioluminescent flora
    this.scatterFlora();

    // 12. Close fog (subtle, right behind platforms)
    this.addFog(GAME_HEIGHT * 0.82, -38, 0.72, 0.2, 75000);
  }

  private addHillLayer(color: number, factor: number, yFrac: number, amp: number, depth: number, alpha: number) {
    const key = `hills_${depth}`;
    if (!this.scene.textures.exists(key)) {
      const w = GAME_WIDTH, h = GAME_HEIGHT;
      const tex = this.scene.textures.createCanvas(key, w, h); if (!tex) return;
      const ctx = tex.getContext(); ctx.clearRect(0, 0, w, h);
      const base = h * yFrac; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, base);
      const seed = Math.random() * 1000;
      for (let x = 0; x <= w; x += 5) {
        const n = Math.sin((x / w) * Math.PI * 4 + seed) * amp * 0.5 + Math.sin((x / w) * Math.PI * 10 + seed * 1.7) * amp * 0.25 + Math.sin((x / w) * Math.PI * 2 + seed * 0.3) * amp * 0.25;
        ctx.lineTo(x, base - n);
      }
      ctx.lineTo(w, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, base - amp, 0, h);
      g.addColorStop(0, this.hexA(color, 1)); g.addColorStop(1, this.hexA(this.darken(color, 0.4), 1));
      ctx.fillStyle = g; ctx.fill(); tex.refresh();
    }
    const img = this.scene.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth).setAlpha(alpha);
    this.tiles.push({ img, factor });
  }

  private scatter(keys: string[], weights: number[], depth: number, factor: number, groundY: number, spacing: number, minS: number, maxS: number, sway: number, alpha: number) {
    const tw = weights.reduce((a, b) => a + b, 0);
    const span = this.worldW / Math.max(factor, 0.1) + GAME_WIDTH * 2;
    for (let x = -GAME_WIDTH; x < span; x += spacing * (0.55 + Math.random() * 0.9)) {
      let r = Math.random() * tw; let key = keys[0];
      for (let i = 0; i < keys.length; i++) { r -= weights[i]; if (r <= 0) { key = keys[i]; break; } }
      const sc = minS + Math.random() * (maxS - minS);
      const y = groundY + Math.random() * 10;
      const tree = this.scene.add.image(x, y, key).setOrigin(0.5, 1).setScale(sc).setDepth(depth).setAlpha(alpha);
      tree.setScrollFactor(factor, 1); // horizontal parallax, planted vertically
      if (Math.random() > 0.5) tree.setFlipX(true);
      if (sway > 0) {
        this.scene.tweens.add({ targets: tree, angle: { from: -sway * (0.5 + Math.random() * 1), to: sway * (0.5 + Math.random() * 1) }, duration: 4000 + Math.random() * 3000, yoyo: true, repeat: -1, ease: "Sine.inOut", delay: Math.random() * 2000 });
      }
    }
  }

  /**
   * Distant mountains as overlapping world-anchored strips, placed and
   * parallaxed exactly like the tree layers so they track the camera the
   * same way (the tilesprite approach didn't line up with the low camera).
   */
  private addMountainStrips(key: string, factor: number, groundY: number, spacing: number, depth: number, alpha: number) {
    // Placed in world space; cover the full scrolled width for this factor.
    const span = this.worldW + GAME_WIDTH * 2 / Math.max(factor, 0.05);
    for (let x = -GAME_WIDTH; x < span; x += spacing) {
      const img = this.scene.add
        .image(x, groundY, key)
        .setOrigin(0.5, 1)
        .setDepth(depth)
        .setAlpha(alpha);
      img.setScrollFactor(factor, 1);
    }
  }

  /** Scatter weathered ruins (arches, pillars, blocks) across the midground. */
  private scatterRuins() {
    const defs = [
      { key: "ruin-arch", min: 0.7, max: 1.1 },
      { key: "ruin-pillar", min: 0.7, max: 1.2 },
      { key: "ruin-block", min: 0.7, max: 1.0 },
    ];
    const factor = 0.3;
    // Ruins sit a little behind the ground line, further from camera.
    const gy = this.groundY - 14;
    const span = this.worldW + GAME_WIDTH * 2 / factor;
    for (let x = -200; x < span; x += 600 + Math.random() * 700) {
      const d = defs[Math.floor(Math.random() * defs.length)];
      const sc = d.min + Math.random() * (d.max - d.min);
      const ruin = this.scene.add
        .image(x, gy, d.key)
        .setOrigin(0.5, 1)
        .setScale(sc)
        .setDepth(-70)
        .setAlpha(0.82);
      ruin.setScrollFactor(factor, 1);
      if (Math.random() > 0.5) ruin.setFlipX(true);
    }
  }

  private addFog(y: number, depth: number, factor: number, alpha: number, ms: number) {
    const img = this.scene.add.tileSprite(0, y, GAME_WIDTH, 220, "fog").setOrigin(0, 0.5).setScrollFactor(0).setDepth(depth).setAlpha(alpha);
    this.tiles.push({ img, factor });
    this.scene.tweens.add({ targets: img, tilePositionX: GAME_WIDTH, duration: ms, repeat: -1, ease: "Linear" });
  }

  /** Volumetric light rays — tall beams angled slightly, very subtle. */
  private addLightRays() {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const x = GAME_WIDTH * 0.1 + (i / count) * GAME_WIDTH * 0.8 + (Math.random() - 0.5) * 200;
      const ray = this.scene.add.image(x, GAME_HEIGHT * 0.1, "ray")
        .setOrigin(0.5, 0)
        .setDisplaySize(40 + Math.random() * 50, GAME_HEIGHT * 0.8)
        .setDepth(-55)
        .setAlpha(0.35 + Math.random() * 0.25)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScrollFactor(0.08 + Math.random() * 0.06)
        .setAngle(-3 + Math.random() * 6);
      // Gentle pulse
      this.scene.tweens.add({ targets: ray, alpha: ray.alpha * 0.5, duration: 5000 + Math.random() * 4000, yoyo: true, repeat: -1, ease: "Sine.inOut", delay: Math.random() * 3000 });
    }
  }

  /** Scatter bioluminescent mushrooms, crystals, and flowers in the background. */
  private scatterFlora() {
    const items = [
      { keys: ["mush-cyan", "mush-blue", "mush-purple", "mush-big"], glowKey: "glow-cyan", glowSize: 80 },
      { keys: ["crystal-cyan", "crystal-blue", "crystal-purple"], glowKey: "glow-blue", glowSize: 60 },
      { keys: ["flower-cyan", "flower-purple"], glowKey: "glow-purple", glowSize: 50 },
    ];
    const factor = 0.5;
    // Background flora sits just behind the ground line.
    const gy = this.groundY - 6;
    const span = this.worldW + GAME_WIDTH * 2 / factor;
    for (let x = -200; x < span; x += 160 + Math.random() * 240) {
      const group = items[Math.floor(Math.random() * items.length)];
      const key = group.keys[Math.floor(Math.random() * group.keys.length)];
      const prop = this.scene.add.image(x, gy, key).setOrigin(0.5, 1).setScale(0.7 + Math.random() * 0.6).setDepth(-52).setAlpha(0.8);
      prop.setScrollFactor(factor, 1);
      // Glow halo centered on the cap
      const halo = this.scene.add.image(x, gy - prop.displayHeight * 0.4, group.glowKey).setDisplaySize(group.glowSize, group.glowSize).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(-53);
      halo.setScrollFactor(factor, 1);
      this.scene.tweens.add({ targets: halo, alpha: 0.12, duration: 2000 + Math.random() * 2500, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    }
  }

  /** Nothing to drive per-frame now: parallax is handled by scrollFactor. */
  update(_camX: number, _camY: number) {}

  private hex(c: number) { return "#" + c.toString(16).padStart(6, "0"); }
  private hexA(c: number, a: number) { return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`; }
  private darken(c: number, f: number) { return (Math.floor(((c >> 16) & 255) * f) << 16) | (Math.floor(((c >> 8) & 255) * f) << 8) | Math.floor((c & 255) * f); }
}
