import Phaser from "phaser";

type C2D = CanvasRenderingContext2D;

/**
 * Procedural texture generation — dark enchanted bioluminescent forest.
 * Based on concept art: very dark world with brilliant cyan/blue/purple
 * glow accents from mushrooms, crystals, flowers, and moss. Ancient
 * gnarled trees with twisted silhouettes.
 */
export class TextureFactory {
  static generateAll(scene: Phaser.Scene) {
    // Glows & particles
    this.glow(scene, "glow", 128, [190,233,255]);
    this.glow(scene, "glow-warm", 128, [255,215,154]);
    this.glow(scene, "glow-cyan", 128, [68,221,255]);
    this.glow(scene, "glow-blue", 96, [51,136,255]);
    this.glow(scene, "glow-purple", 96, [153,102,255]);
    this.glow(scene, "glow-green", 96, [51,255,170]);
    this.softDot(scene, "spark", 16);
    this.softDot(scene, "dust", 10);
    this.softDot(scene, "spore", 6);
    this.firefly(scene, "firefly", 10);
    this.titleMote(scene, "lumi", 64);
    this.seedSprite(scene, "seed", 40);
    this.starField(scene, "stars", 1280, 720, 100);

    // Enchanted forest trees — 4 distinct types across layers
    // Far: tall dark spires, barely visible
    for (let i = 0; i < 3; i++) this.ancientTree(scene, `tree-far-${i}`, 160 + i*40, 380 + i*50, 0x030608, 0x050a10, 0.3);
    // Mid: gnarled oaks with glowing moss patches
    for (let i = 0; i < 3; i++) this.gnarlTree(scene, `tree-mid-${i}`, 200 + i*30, 360 + i*40, 0x060e16, 0x0a1824, 0.6);
    // Near: twisted willows with hanging luminous vines
    for (let i = 0; i < 3; i++) this.twistTree(scene, `tree-near-${i}`, 220 + i*40, 400 + i*50, 0x0a1820, 0x122838, 0.85);
    // Giant ancient with roots and canopy
    this.massiveTree(scene, "tree-giant", 440, 640);
    // Dead twisted silhouettes
    for (let i = 0; i < 2; i++) this.deadTree(scene, `tree-dead-${i}`, 140 + i*40, 300 + i*60, 0x040810);

    // Bioluminescent flora
    this.glowMushroom(scene, "mush-cyan", 44, 52, [40,200,255], [20,160,230]);
    this.glowMushroom(scene, "mush-blue", 36, 44, [60,140,255], [30,100,210]);
    this.glowMushroom(scene, "mush-purple", 40, 48, [140,80,255], [100,50,200]);
    this.bigMushroom(scene, "mush-big", 80, 90, [50,210,255], [25,170,235]);
    this.glowCrystal(scene, "crystal-cyan", 30, 64, [60,220,255]);
    this.glowCrystal(scene, "crystal-blue", 26, 56, [50,130,255]);
    this.glowCrystal(scene, "crystal-purple", 24, 52, [130,80,255]);
    this.glowFlower(scene, "flower-cyan", 20, 28, [80,230,255]);
    this.glowFlower(scene, "flower-purple", 18, 24, [160,100,255]);
    this.lumiVine(scene, "vine-glow", 14, 200);
    this.grassTuft(scene, "grass", 44, 28, 0x0c3020);
    this.mossGrass(scene, "moss", 50, 16, [30,180,120]);
    this.rock(scene, "rock-sm", 54, 36);
    this.rock(scene, "rock-lg", 100, 56);
    this.fogBand(scene, "fog", 1280, 220);
    this.waterTile(scene, "water", 1280, 180);
    this.lightRay(scene, "ray", 60, 400);

    // Distant horizon layers (seamless, tiled) and midground ruins
    this.mountains(scene, "mountains-far", 1280, 360, 0x0b1626, 0x060d1a, 0.9);
    this.mountains(scene, "mountains-near", 1280, 300, 0x0e1b2e, 0x081322, 1.3);
    this.ruinArch(scene, "ruin-arch", 220, 260);
    this.ruinPillar(scene, "ruin-pillar", 70, 240);
    this.ruinBlock(scene, "ruin-block", 160, 110);
    this.mossEdge(scene, "moss-edge", 256, 20);
    this.memorySeed(scene, "seed-core", 48);
  }

  // ============ GLOWS & PARTICLES ============

  private static glow(s: Phaser.Scene, key: string, size: number, rgb: number[]) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); const r = size / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
    g.addColorStop(0.35, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.6)`);
    g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
  }

  private static softDot(s: Phaser.Scene, key: string, size: number) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); const r = size / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(200,240,255,0.8)");
    g.addColorStop(1, "rgba(150,220,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
  }

  private static firefly(s: Phaser.Scene, key: string, size: number) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); const r = size / 2;
    const g = c.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(140,240,255,1)");
    g.addColorStop(0.3, "rgba(80,200,255,0.6)");
    g.addColorStop(1, "rgba(60,180,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
  }

  private static titleMote(s: Phaser.Scene, key: string, size: number) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); const cx = size / 2;
    let g = c.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, "rgba(200,240,255,0.5)");
    g.addColorStop(0.5, "rgba(130,210,245,0.15)");
    g.addColorStop(1, "rgba(100,190,235,0)");
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    g = c.createRadialGradient(cx, cx - 1, 0, cx, cx, cx * 0.3);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.6, "rgba(210,240,255,1)");
    g.addColorStop(1, "rgba(160,215,245,0.7)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cx, cx * 0.28, 0, Math.PI * 2); c.fill();
    t.refresh();
  }

  private static seedSprite(s: Phaser.Scene, key: string, size: number) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); const cx = size / 2;
    let g = c.createRadialGradient(cx, cx, 0, cx, cx, cx);
    g.addColorStop(0, "rgba(170,238,255,0.6)");
    g.addColorStop(0.5, "rgba(120,210,255,0.2)");
    g.addColorStop(1, "rgba(100,200,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    g = c.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.35);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(150,230,255,0.9)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cx, cx * 0.3, 0, Math.PI * 2); c.fill();
    t.refresh();
  }

  private static starField(s: Phaser.Scene, key: string, w: number, h: number, n: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = Math.random() * 1.5 + 0.3, a = Math.random() * 0.5 + 0.1;
      c.fillStyle = `rgba(180,220,255,${a})`; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      if (r > 1) {
        const bg = c.createRadialGradient(x, y, 0, x, y, r * 3);
        bg.addColorStop(0, `rgba(180,220,255,${a * 0.25})`);
        bg.addColorStop(1, "rgba(180,220,255,0)");
        c.fillStyle = bg; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      }
    }
    t.refresh();
  }

  // ============ ENCHANTED FOREST TREES ============

  /** Far layer: tall dark spires barely visible against the dark sky. */
  private static ancientTree(s: Phaser.Scene, key: string, w: number, h: number, trunk: number, canopy: number, detail: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2; const tw = w * 0.06;
    // Trunk
    c.fillStyle = this.rgba(trunk, 1);
    c.beginPath();
    c.moveTo(cx - tw * 1.5, h); c.quadraticCurveTo(cx - tw, h * 0.4, cx - tw * 0.3, h * 0.2);
    c.lineTo(cx + tw * 0.3, h * 0.2); c.quadraticCurveTo(cx + tw, h * 0.4, cx + tw * 1.5, h);
    c.closePath(); c.fill();
    // Canopy — tall pointed mass
    for (let i = 0; i < 4 + detail * 3; i++) {
      const ox = cx + (Math.random() - 0.5) * w * 0.4;
      const oy = h * (0.02 + Math.random() * 0.3);
      const rr = w * (0.1 + Math.random() * 0.15);
      c.fillStyle = this.rgba(canopy, 0.25 + Math.random() * 0.25);
      c.beginPath(); c.ellipse(ox, oy, rr, rr * 1.5, 0, 0, Math.PI * 2); c.fill();
    }
    t.refresh();
  }

  /** Mid layer: gnarled oaks with thick trunk, branches, and glowing moss. */
  private static gnarlTree(s: Phaser.Scene, key: string, w: number, h: number, trunk: number, canopy: number, detail: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2; const tw = w * 0.1;
    // Thick gnarled trunk
    c.fillStyle = this.rgba(trunk, 1);
    c.beginPath();
    c.moveTo(cx - tw * 1.4, h); c.quadraticCurveTo(cx - tw * 1.6, h * 0.55, cx - tw * 0.5, h * 0.28);
    c.lineTo(cx + tw * 0.5, h * 0.28); c.quadraticCurveTo(cx + tw * 1.6, h * 0.55, cx + tw * 1.4, h);
    c.closePath(); c.fill();
    // Branches
    const bc = Math.floor(4 + detail * 5);
    for (let i = 0; i < bc; i++) {
      const by = h * (0.18 + Math.random() * 0.25);
      const dir = Math.random() > 0.5 ? 1 : -1;
      const len = w * (0.15 + Math.random() * 0.2);
      c.strokeStyle = this.rgba(trunk, 0.85); c.lineWidth = 2 + detail * 2; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx + (Math.random() - 0.5) * tw, by);
      c.quadraticCurveTo(cx + dir * len * 0.5, by - 15, cx + dir * len, by - 5 + Math.random() * 20);
      c.stroke();
    }
    // Canopy blobs
    for (let i = 0; i < 6 + detail * 3; i++) {
      const ox = cx + (Math.random() - 0.5) * w * 0.7;
      const oy = h * (0.04 + Math.random() * 0.25);
      c.fillStyle = this.rgba(canopy, 0.25 + Math.random() * 0.3);
      c.beginPath(); c.ellipse(ox, oy, w * (0.12 + Math.random() * 0.15), h * (0.06 + Math.random() * 0.06), 0, 0, Math.PI * 2); c.fill();
    }
    // Glowing moss patches on trunk
    if (detail > 0.4) {
      for (let i = 0; i < 3; i++) {
        const my = h * (0.35 + Math.random() * 0.3);
        const mx = cx + (Math.random() - 0.5) * tw * 2;
        const mg = c.createRadialGradient(mx, my, 0, mx, my, 8 + Math.random() * 6);
        mg.addColorStop(0, "rgba(30,200,140,0.3)");
        mg.addColorStop(1, "rgba(30,200,140,0)");
        c.fillStyle = mg; c.fillRect(mx - 14, my - 14, 28, 28);
      }
    }
    t.refresh();
  }

  /** Near layer: twisted trees with hanging luminous vines/tendrils. */
  private static twistTree(s: Phaser.Scene, key: string, w: number, h: number, trunk: number, canopy: number, detail: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2; const tw = w * 0.08;
    // Curved trunk
    c.fillStyle = this.rgba(trunk, 1);
    c.beginPath();
    c.moveTo(cx - tw, h); c.quadraticCurveTo(cx - tw * 0.5, h * 0.45, cx - 4, h * 0.2);
    c.lineTo(cx + 6, h * 0.2); c.quadraticCurveTo(cx + tw * 0.7, h * 0.45, cx + tw, h);
    c.closePath(); c.fill();
    // Canopy
    const canopyY = h * 0.12;
    c.fillStyle = this.rgba(canopy, 0.4);
    c.beginPath(); c.ellipse(cx, canopyY, w * 0.4, h * 0.1, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 5; i++) {
      c.fillStyle = this.rgba(canopy, 0.2 + Math.random() * 0.2);
      c.beginPath(); c.ellipse(cx + (Math.random() - 0.5) * w * 0.5, canopyY + (Math.random() - 0.5) * h * 0.08, w * (0.1 + Math.random() * 0.15), h * (0.04 + Math.random() * 0.04), 0, 0, Math.PI * 2); c.fill();
    }
    // Hanging luminous vines
    if (detail > 0.5) {
      const vc = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < vc; i++) {
        const vx = cx + (Math.random() - 0.5) * w * 0.6;
        // Hang from the lower canopy so vines sit within the trunk zone,
        // not far above the visible frame.
        const vy = canopyY + h * (0.18 + Math.random() * 0.12);
        const vLen = h * (0.1 + Math.random() * 0.16);
        const sway = (Math.random() - 0.5) * 16;
        c.strokeStyle = `rgba(40,180,160,${0.15 + Math.random() * 0.15})`;
        c.lineWidth = 1 + Math.random() * 0.8;
        c.beginPath(); c.moveTo(vx, vy);
        c.quadraticCurveTo(vx + sway, vy + vLen * 0.6, vx + sway * 0.8, vy + vLen);
        c.stroke();
        // Glowing tip
        const tg = c.createRadialGradient(vx + sway * 0.8, vy + vLen, 0, vx + sway * 0.8, vy + vLen, 4);
        tg.addColorStop(0, "rgba(80,230,200,0.4)");
        tg.addColorStop(1, "rgba(80,230,200,0)");
        c.fillStyle = tg; c.fillRect(vx + sway * 0.8 - 5, vy + vLen - 5, 10, 10);
      }
    }
    t.refresh();
  }

  /** Massive ancient tree with roots and heavy canopy. */
  private static massiveTree(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2; const tw = w * 0.14;
    // Roots
    for (let i = 0; i < 7; i++) {
      const rx = cx + (i - 3) * tw * 0.8;
      c.fillStyle = this.rgba(0x050c14, 0.9);
      c.beginPath(); c.moveTo(rx, h);
      c.quadraticCurveTo(rx + (Math.random() - 0.5) * 40, h * 0.7, cx + (Math.random() - 0.5) * tw * 0.5, h * 0.5);
      c.quadraticCurveTo(cx + (Math.random() - 0.5) * tw * 0.3, h * 0.7, rx + 14, h);
      c.closePath(); c.fill();
    }
    // Trunk
    c.fillStyle = this.rgba(0x050c14, 1);
    c.beginPath();
    c.moveTo(cx - tw * 1.4, h); c.quadraticCurveTo(cx - tw * 1.2, h * 0.45, cx - tw * 0.4, h * 0.2);
    c.lineTo(cx + tw * 0.4, h * 0.2); c.quadraticCurveTo(cx + tw * 1.2, h * 0.45, cx + tw * 1.4, h);
    c.closePath(); c.fill();
    // Canopy
    const cols = [0x040a12, 0x060e18, 0x081420];
    for (let i = 0; i < 12; i++) {
      c.fillStyle = this.rgba(cols[i % 3], 0.3 + Math.random() * 0.3);
      c.beginPath(); c.ellipse(cx + (Math.random() - 0.5) * w * 0.6, h * (0.02 + Math.random() * 0.2), w * (0.12 + Math.random() * 0.18), h * (0.04 + Math.random() * 0.07), 0, 0, Math.PI * 2); c.fill();
    }
    // Moss glow patches
    for (let i = 0; i < 5; i++) {
      const mx = cx + (Math.random() - 0.5) * tw * 2.5;
      const my = h * (0.3 + Math.random() * 0.35);
      const mg = c.createRadialGradient(mx, my, 0, mx, my, 10);
      mg.addColorStop(0, "rgba(40,210,160,0.25)");
      mg.addColorStop(1, "rgba(40,210,160,0)");
      c.fillStyle = mg; c.fillRect(mx - 12, my - 12, 24, 24);
    }
    t.refresh();
  }

  /** Dead twisted tree. */
  private static deadTree(s: Phaser.Scene, key: string, w: number, h: number, col: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    c.strokeStyle = this.rgba(col, 0.9); c.lineWidth = 3.5; c.lineCap = "round";
    c.beginPath(); c.moveTo(cx, h); c.quadraticCurveTo(cx + 8, h * 0.55, cx - 4, h * 0.22); c.stroke();
    for (let i = 0; i < 5 + Math.floor(Math.random() * 4); i++) {
      const by = h * (0.12 + Math.random() * 0.35);
      const dir = Math.random() > 0.5 ? 1 : -1;
      const len = w * (0.15 + Math.random() * 0.28);
      c.lineWidth = 1.5 + Math.random() * 2;
      c.beginPath(); c.moveTo(cx + (Math.random() - 0.5) * 6, by);
      c.quadraticCurveTo(cx + dir * len * 0.6, by - 10, cx + dir * len, by - Math.random() * h * 0.12);
      c.stroke();
    }
    t.refresh();
  }

  // ============ HORIZON & RUINS ============

  /**
   * A seamless, horizontally-tileable band of distant mountain peaks with
   * a faint atmospheric glow along the ridge. Transparent above the ridge.
   */
  private static mountains(s: Phaser.Scene, key: string, w: number, h: number, top: number, bot: number, freq: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    // Ridge via summed sines; endpoints match for seamless tiling (period = w).
    const base = h * 0.42;
    const ridge = (x: number) => {
      const p = (x / w) * Math.PI * 2;
      return base
        - Math.sin(p * freq) * h * 0.26
        - Math.sin(p * (freq * 2) + 1.3) * h * 0.13
        - Math.sin(p * (freq * 4) + 0.7) * h * 0.06;
    };
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) c.lineTo(x, ridge(x));
    c.lineTo(w, h);
    c.closePath();
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, this.rgba(top, 1));
    g.addColorStop(1, this.rgba(bot, 1));
    c.fillStyle = g;
    c.fill();
    // Soft rim glow along the ridge (clipped to the silhouette top)
    c.save();
    c.clip();
    c.strokeStyle = "rgba(90,150,210,0.18)";
    c.lineWidth = 3;
    c.beginPath();
    for (let x = 0; x <= w; x += 4) { if (x === 0) c.moveTo(x, ridge(x)); else c.lineTo(x, ridge(x)); }
    c.stroke();
    c.restore();
    t.refresh();
  }

  /** A crumbling stone arch — weathered, cracked, faint luminous markings. */
  private static ruinArch(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const pw = w * 0.2; // pillar width
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(34,46,64,1)");
    g.addColorStop(1, "rgba(16,24,36,1)");
    c.fillStyle = g;
    // Left pillar, broken at the top
    c.beginPath();
    c.moveTo(0, h); c.lineTo(2, h * 0.34); c.lineTo(pw * 0.5, h * 0.28);
    c.lineTo(pw, h * 0.34); c.lineTo(pw, h); c.closePath(); c.fill();
    // Right pillar
    c.beginPath();
    c.moveTo(w - pw, h); c.lineTo(w - pw, h * 0.3); c.lineTo(w - pw * 0.5, h * 0.24);
    c.lineTo(w - 2, h * 0.3); c.lineTo(w, h); c.closePath(); c.fill();
    // Arch spanning the two pillars
    c.beginPath();
    c.moveTo(pw * 0.5, h * 0.28);
    c.quadraticCurveTo(w / 2, -h * 0.14, w - pw * 0.5, h * 0.24);
    c.lineTo(w - pw, h * 0.34);
    c.quadraticCurveTo(w / 2, h * 0.06, pw, h * 0.34);
    c.closePath(); c.fill();
    this.weather(c, w, h, pw);
    // Luminous rune markings
    c.save();
    c.shadowColor = "rgba(80,210,255,0.9)"; c.shadowBlur = 5;
    c.strokeStyle = "rgba(120,230,255,0.55)"; c.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) {
      const rx = pw * 0.5 + i * 2; const ry = h * (0.5 + i * 0.13);
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 7, ry + 2); c.moveTo(rx + 3, ry - 3); c.lineTo(rx + 3, ry + 5); c.stroke();
    }
    c.restore();
    t.refresh();
  }

  /** A leaning weathered pillar. */
  private static ruinPillar(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(20,30,44,1)");
    g.addColorStop(0.5, "rgba(38,50,68,1)");
    g.addColorStop(1, "rgba(22,32,46,1)");
    c.fillStyle = g;
    c.save();
    c.translate(w / 2, h); c.rotate(-0.06);
    c.beginPath();
    c.moveTo(-w * 0.32, 0); c.lineTo(-w * 0.26, -h * 0.78);
    c.lineTo(-w * 0.34, -h * 0.86); c.lineTo(w * 0.1, -h * 0.9);
    c.lineTo(w * 0.3, -h * 0.8); c.lineTo(w * 0.3, 0); c.closePath(); c.fill();
    // cracks
    c.strokeStyle = "rgba(10,16,26,0.7)"; c.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const cy = -h * (0.15 + Math.random() * 0.6);
      c.beginPath(); c.moveTo(-w * 0.1, cy); c.lineTo(w * (Math.random() * 0.2), cy - 6 - Math.random() * 10); c.stroke();
    }
    // moss glow at base
    c.save(); c.shadowColor = "rgba(40,210,160,0.8)"; c.shadowBlur = 6;
    c.strokeStyle = "rgba(50,220,170,0.4)"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-w * 0.2, -4); c.lineTo(w * 0.15, -2); c.stroke();
    c.restore();
    c.restore();
    t.refresh();
  }

  /** A broken rectangular stone block, half-sunk. */
  private static ruinBlock(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(36,48,66,1)");
    g.addColorStop(1, "rgba(18,26,38,1)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(w * 0.04, h); c.lineTo(0, h * 0.34); c.lineTo(w * 0.4, h * 0.2);
    c.lineTo(w * 0.72, h * 0.28); c.lineTo(w, h * 0.4); c.lineTo(w * 0.94, h); c.closePath(); c.fill();
    this.weather(c, w, h, w);
    // top highlight
    c.strokeStyle = "rgba(70,100,140,0.3)"; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(w * 0.4, h * 0.2); c.lineTo(w * 0.72, h * 0.28); c.stroke();
    t.refresh();
  }

  /**
   * A memory seed — a faceted crystalline teardrop of condensed light with
   * an inner spark. The outer bloom is a separate scene glow so this never
   * clips. Drawn vertical (point up).
   */
  private static memorySeed(s: Phaser.Scene, key: string, size: number) {
    const t = s.textures.createCanvas(key, size, size); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, size, size);
    const cx = size / 2;
    const topY = size * 0.16;
    const botY = size * 0.84;
    const midY = size * 0.56;
    const hw = size * 0.26;
    c.save();
    c.shadowColor = "rgba(120,225,255,0.9)";
    c.shadowBlur = 6;
    const g = c.createLinearGradient(cx - hw, topY, cx + hw, botY);
    g.addColorStop(0, "rgba(230,250,255,0.98)");
    g.addColorStop(0.5, "rgba(150,220,255,0.95)");
    g.addColorStop(1, "rgba(120,170,255,0.9)");
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx, topY); c.lineTo(cx + hw, midY); c.lineTo(cx, botY); c.lineTo(cx - hw, midY); c.closePath();
    c.fill();
    c.restore();
    c.fillStyle = "rgba(255,255,255,0.35)";
    c.beginPath(); c.moveTo(cx, topY); c.lineTo(cx + hw, midY); c.lineTo(cx, midY); c.closePath(); c.fill();
    c.fillStyle = "rgba(90,140,220,0.3)";
    c.beginPath(); c.moveTo(cx, botY); c.lineTo(cx + hw, midY); c.lineTo(cx, midY); c.closePath(); c.fill();
    c.strokeStyle = "rgba(220,245,255,0.6)"; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(cx, topY); c.lineTo(cx, botY); c.moveTo(cx - hw, midY); c.lineTo(cx + hw, midY); c.stroke();
    const sp = c.createRadialGradient(cx, midY, 0, cx, midY, hw * 0.7);
    sp.addColorStop(0, "rgba(255,255,255,0.95)"); sp.addColorStop(1, "rgba(200,240,255,0)");
    c.fillStyle = sp; c.beginPath(); c.arc(cx, midY, hw * 0.7, 0, Math.PI * 2); c.fill();
    t.refresh();
  }

  /**
   * A seamless, tileable strip of glowing moss + fine grass blades for the
   * lit top edge of platforms. Transparent background; sits on the surface.
   */
  private static mossEdge(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    // Soft moss glow band along the surface
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(60,230,170,0.5)");
    g.addColorStop(0.4, "rgba(40,190,150,0.3)");
    g.addColorStop(1, "rgba(30,150,120,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // Fine grass blades (wrap-safe: blades near edges stay inside)
    c.lineCap = "round";
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const bh = 4 + Math.random() * (h - 4);
      const lean = (Math.random() - 0.5) * 5;
      const a = 0.25 + Math.random() * 0.45;
      const bg = c.createLinearGradient(x, h, x + lean, h - bh);
      bg.addColorStop(0, `rgba(40,180,130,${a})`);
      bg.addColorStop(1, `rgba(120,255,200,0)`);
      c.strokeStyle = bg;
      c.lineWidth = 0.7 + Math.random() * 0.6;
      c.beginPath();
      c.moveTo(x, h);
      c.quadraticCurveTo(x + lean * 0.5, h - bh * 0.6, x + lean, h - bh);
      c.stroke();
    }
    // A few brighter moss dots
    for (let i = 0; i < 24; i++) {
      const x = Math.random() * w;
      const y = h - 1 - Math.random() * 3;
      c.fillStyle = `rgba(120,255,210,${0.3 + Math.random() * 0.4})`;
      c.beginPath(); c.arc(x, y, 0.6 + Math.random(), 0, Math.PI * 2); c.fill();
    }
    t.refresh();
  }

  /** Shared cracks + moss speckle used by ruin textures. */
  private static weather(c: C2D, w: number, h: number, span: number) {
    c.strokeStyle = "rgba(10,16,26,0.6)"; c.lineWidth = 0.9;
    for (let i = 0; i < 6; i++) {
      const sx = (w - span) / 2 + Math.random() * span;
      const sy = h * (0.3 + Math.random() * 0.6);
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(sx + (Math.random() - 0.5) * 24, sy + Math.random() * 18); c.stroke();
    }
    // faint green moss specks
    for (let i = 0; i < 20; i++) {
      const mx = (w - span) / 2 + Math.random() * span;
      const my = h * (0.4 + Math.random() * 0.55);
      c.fillStyle = `rgba(40,150,110,${0.1 + Math.random() * 0.18})`;
      c.beginPath(); c.arc(mx, my, 0.6 + Math.random() * 1.4, 0, Math.PI * 2); c.fill();
    }
  }

  // ============ BIOLUMINESCENT FLORA ============

  /** Glowing mushroom — the signature element of the enchanted forest. */
  private static glowMushroom(s: Phaser.Scene, key: string, w: number, h: number, rgb: number[], rgbDark: number[]) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    // Stem
    c.fillStyle = `rgba(${rgbDark[0] >> 1},${rgbDark[1] >> 1},${rgbDark[2] >> 1},0.8)`;
    c.beginPath(); c.moveTo(cx - 3, h); c.quadraticCurveTo(cx - 4, h * 0.5, cx - 2, h * 0.38);
    c.lineTo(cx + 2, h * 0.38); c.quadraticCurveTo(cx + 4, h * 0.5, cx + 3, h); c.closePath(); c.fill();
    // Cap
    const capY = h * 0.2; const capRX = w * 0.45; const capRY = h * 0.2;
    const cg = c.createRadialGradient(cx, capY + capRY * 0.2, 0, cx, capY + capRY * 0.3, capRX);
    cg.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
    cg.addColorStop(0.5, `rgba(${rgbDark[0]},${rgbDark[1]},${rgbDark[2]},0.85)`);
    cg.addColorStop(1, `rgba(${rgbDark[0] >> 1},${rgbDark[1] >> 1},${rgbDark[2] >> 1},0.5)`);
    c.fillStyle = cg; c.beginPath(); c.ellipse(cx, capY + capRY * 0.3, capRX, capRY, 0, Math.PI, Math.PI * 2); c.closePath(); c.fill();
    // (Bloom is drawn as a separate scene glow image so it never clips.)
    // Bioluminescent spots
    for (let i = 0; i < 5; i++) {
      const sx = cx + (Math.random() - 0.5) * capRX * 1.2;
      const sy = capY + Math.random() * capRY * 0.4;
      c.fillStyle = `rgba(${Math.min(255, rgb[0] + 60)},${Math.min(255, rgb[1] + 40)},${Math.min(255, rgb[2] + 20)},0.8)`;
      c.beginPath(); c.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2); c.fill();
    }
    t.refresh();
  }

  /** Large mushroom cluster — prominent environmental feature. */
  private static bigMushroom(s: Phaser.Scene, key: string, w: number, h: number, rgb: number[], rgbDark: number[]) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    // Thick stem
    c.fillStyle = `rgba(${rgbDark[0] >> 1},${rgbDark[1] >> 1},${rgbDark[2] >> 1},0.85)`;
    c.beginPath(); c.moveTo(cx - 6, h); c.quadraticCurveTo(cx - 8, h * 0.45, cx - 4, h * 0.32);
    c.lineTo(cx + 4, h * 0.32); c.quadraticCurveTo(cx + 8, h * 0.45, cx + 6, h); c.closePath(); c.fill();
    // Large cap
    const capY = h * 0.18; const capRX = w * 0.46; const capRY = h * 0.2;
    const cg = c.createRadialGradient(cx, capY + capRY * 0.15, 0, cx, capY + capRY * 0.3, capRX);
    cg.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
    cg.addColorStop(0.6, `rgba(${rgbDark[0]},${rgbDark[1]},${rgbDark[2]},0.9)`);
    cg.addColorStop(1, `rgba(${rgbDark[0] >> 1},${rgbDark[1] >> 1},${rgbDark[2] >> 1},0.6)`);
    c.fillStyle = cg; c.beginPath(); c.ellipse(cx, capY + capRY * 0.3, capRX, capRY, 0, Math.PI, Math.PI * 2); c.closePath(); c.fill();
    // Cap underside glow (drips downward)
    const ug = c.createLinearGradient(0, capY + capRY * 0.3, 0, capY + capRY * 0.3 + 14);
    ug.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35)`);
    ug.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    c.fillStyle = ug; c.fillRect(cx - capRX, capY + capRY * 0.3, capRX * 2, 14);
    // (Bright bloom is a separate scene glow image so it never clips.)
    t.refresh();
  }

  /** Glowing crystal shard with inner light. */
  private static glowCrystal(s: Phaser.Scene, key: string, w: number, h: number, rgb: number[]) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    // Shard body
    const sg = c.createLinearGradient(0, 0, 0, h);
    sg.addColorStop(0, `rgba(${Math.min(255, rgb[0] + 80)},${Math.min(255, rgb[1] + 60)},${rgb[2]},0.95)`);
    sg.addColorStop(0.3, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.85)`);
    sg.addColorStop(1, `rgba(${rgb[0] >> 1},${rgb[1] >> 1},${rgb[2] >> 1},0.5)`);
    c.fillStyle = sg;
    c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx + w * 0.42, h * 0.65); c.lineTo(cx + w * 0.18, h);
    c.lineTo(cx - w * 0.18, h); c.lineTo(cx - w * 0.42, h * 0.65); c.closePath(); c.fill();
    // Inner bright line
    c.strokeStyle = `rgba(${Math.min(255, rgb[0] + 100)},${Math.min(255, rgb[1] + 80)},255,0.5)`;
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - 1, h * 0.06); c.lineTo(cx - 2, h * 0.65); c.stroke();
    // (Bloom is a separate scene glow image so it never clips.)
    t.refresh();
  }

  /** Small glowing flower. */
  private static glowFlower(s: Phaser.Scene, key: string, w: number, h: number, rgb: number[]) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    // Stem
    c.strokeStyle = "rgba(30,90,60,0.6)"; c.lineWidth = 1.5; c.beginPath();
    c.moveTo(cx, h); c.quadraticCurveTo(cx - 2, h * 0.5, cx, h * 0.35); c.stroke();
    // Petals (radial)
    const pc = 5;
    for (let i = 0; i < pc; i++) {
      const a = (i / pc) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * w * 0.2;
      const py = h * 0.25 + Math.sin(a) * h * 0.15;
      c.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.7)`;
      c.beginPath(); c.ellipse(px, py, w * 0.12, h * 0.08, a, 0, Math.PI * 2); c.fill();
    }
    // Center glow
    const fg = c.createRadialGradient(cx, h * 0.25, 0, cx, h * 0.25, w * 0.3);
    fg.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.8)`);
    fg.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    c.fillStyle = fg; c.fillRect(cx - w * 0.4, h * 0.05, w * 0.8, h * 0.4);
    t.refresh();
  }

  /** Hanging vine with glowing tips. */
  private static lumiVine(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    c.strokeStyle = "rgba(25,80,55,0.6)"; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, 0);
    for (let y = 0; y < h; y += 6) c.lineTo(cx + Math.sin(y * 0.05) * 3, y); c.stroke();
    // Glowing buds along vine
    for (let i = 0; i < 6; i++) {
      const ly = 20 + i * (h / 7); const lx = cx + Math.sin(ly * 0.05) * 3;
      const bg = c.createRadialGradient(lx, ly, 0, lx, ly, 5);
      bg.addColorStop(0, "rgba(60,220,180,0.5)"); bg.addColorStop(1, "rgba(60,220,180,0)");
      c.fillStyle = bg; c.fillRect(lx - 6, ly - 6, 12, 12);
      c.fillStyle = "rgba(100,240,200,0.8)"; c.beginPath(); c.arc(lx, ly, 1.5, 0, Math.PI * 2); c.fill();
    }
    t.refresh();
  }

  private static grassTuft(s: Phaser.Scene, key: string, w: number, h: number, col: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const cx = w / 2;
    for (let i = 0; i < 8; i++) {
      const bx = cx + (i - 3.5) * (w / 8) + (Math.random() - 0.5) * 4;
      const bh = h * (0.4 + Math.random() * 0.6); const lean = (Math.random() - 0.5) * 8;
      c.strokeStyle = this.rgba(col, 0.3 + Math.random() * 0.4); c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(bx, h); c.quadraticCurveTo(bx + lean, h - bh * 0.6, bx + lean * 1.5, h - bh); c.stroke();
    }
    t.refresh();
  }

  /** Glowing moss strip (platform edge decoration). */
  private static mossGrass(s: Phaser.Scene, key: string, w: number, h: number, rgb: number[]) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) {
      const bh = h * (0.3 + Math.random() * 0.7);
      const a = 0.2 + Math.random() * 0.4;
      c.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
      c.fillRect(x, h - bh, 2, bh);
    }
    // Glow overlay
    const mg = c.createLinearGradient(0, 0, 0, h);
    mg.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.15)`);
    mg.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    c.fillStyle = mg; c.fillRect(0, 0, w, h);
    t.refresh();
  }

  private static rock(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(16,28,40,0.9)"); g.addColorStop(1, "rgba(8,14,22,0.7)");
    c.fillStyle = g; c.beginPath();
    c.moveTo(w * 0.15, h); c.lineTo(w * 0.05, h * 0.5); c.lineTo(w * 0.25, h * 0.1);
    c.lineTo(w * 0.6, h * 0.05); c.lineTo(w * 0.9, h * 0.25);
    c.lineTo(w * 0.95, h * 0.65); c.lineTo(w * 0.8, h); c.closePath(); c.fill();
    // Moss highlight on top edge
    c.strokeStyle = "rgba(30,160,110,0.25)"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(w * 0.25, h * 0.1); c.lineTo(w * 0.6, h * 0.05); c.lineTo(w * 0.9, h * 0.25); c.stroke();
    t.refresh();
  }

  private static fogBand(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(10,25,40,0)"); g.addColorStop(0.3, "rgba(12,30,48,0.12)");
    g.addColorStop(0.5, "rgba(15,35,55,0.18)"); g.addColorStop(0.7, "rgba(12,30,48,0.12)");
    g.addColorStop(1, "rgba(10,25,40,0)");
    c.fillStyle = g; c.fillRect(0, 0, w, h); t.refresh();
  }

  private static waterTile(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext();
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "rgba(6,20,40,0.6)"); bg.addColorStop(0.3, "rgba(10,30,55,0.5)"); bg.addColorStop(1, "rgba(4,14,30,0.7)");
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) {
      const y = 4 + Math.random() * 20;
      c.strokeStyle = `rgba(60,180,255,${0.06 + Math.random() * 0.08})`; c.lineWidth = 1 + Math.random();
      c.beginPath(); c.moveTo(0, y);
      for (let x = 0; x < w; x += 30) c.lineTo(x, y + Math.sin(x * 0.03 + i) * 3);
      c.stroke();
    }
    t.refresh();
  }

  /** Volumetric light ray (vertical beam). */
  private static lightRay(s: Phaser.Scene, key: string, w: number, h: number) {
    const t = s.textures.createCanvas(key, w, h); if (!t) return;
    const c = t.getContext(); c.clearRect(0, 0, w, h);
    // Tapered beam wider at top
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(100,200,255,0.06)");
    g.addColorStop(0.3, "rgba(80,180,240,0.04)");
    g.addColorStop(1, "rgba(60,160,220,0)");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
    c.lineTo(w * 0.7, h); c.lineTo(w * 0.3, h); c.closePath(); c.fill();
    t.refresh();
  }

  // ============ HELPERS ============
  private static rgba(c: number, a: number) { return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`; }
}
