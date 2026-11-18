import Phaser from "phaser";

/**
 * A frozen stone guardian — a deer-like creature caught mid-breath by the
 * Hush. It stands grey and lifeless until Lumi reaches it with all the
 * memory seeds, then colour and light flood back in and it stirs.
 *
 * Built procedurally from a baked stone texture plus an overlaid "alive"
 * texture that we cross-fade to during the reawakening.
 */
export class Guardian {
  private scene: Phaser.Scene;
  readonly x: number;
  readonly y: number; // ground line the hooves rest on
  private stone: Phaser.GameObjects.Image;
  private alive: Phaser.GameObjects.Image;
  private bloom: Phaser.GameObjects.Image;
  private root: Phaser.GameObjects.Container;
  awoken = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    Guardian.buildTextures(scene);

    // Soft bloom behind, hidden until awakening
    this.bloom = scene.add.image(0, -70, "glow-warm").setDisplaySize(20, 20).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    // Grey frozen form (visible) and the living form (hidden, faded in later)
    this.stone = scene.add.image(0, 0, "guardian-stone").setOrigin(0.5, 1);
    this.alive = scene.add.image(0, 0, "guardian-alive").setOrigin(0.5, 1).setAlpha(0);

    this.root = scene.add.container(x, y, [this.bloom, this.stone, this.alive]).setDepth(16);

    // A faint, slow breathing wobble even while frozen (barely alive)
    scene.tweens.add({
      targets: this.root,
      scaleY: 1.004,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** Distance from a point to the guardian's heart. */
  distanceTo(px: number, py: number) {
    return Phaser.Math.Distance.Between(px, py, this.x, this.y - 90);
  }

  /** Trigger the reawakening. Returns false if already awake. */
  reawaken(): boolean {
    if (this.awoken) return false;
    this.awoken = true;
    const s = this.scene;

    // Colour floods in: cross-fade stone → alive, bloom swells
    s.tweens.add({ targets: this.alive, alpha: 1, duration: 1600, ease: "Sine.inOut" });
    s.tweens.add({ targets: this.stone, alpha: 0.15, duration: 1600, ease: "Sine.inOut" });
    s.tweens.add({ targets: this.bloom, displayWidth: 420, displayHeight: 420, alpha: 0.75, duration: 1800, ease: "Sine.out", yoyo: true, hold: 400 });

    // The creature lifts its head and stirs
    s.tweens.add({ targets: this.root, scaleY: 1.05, scaleX: 0.98, duration: 500, yoyo: true, ease: "Quad.out" });

    // Light burst
    s.add
      .particles(this.x, this.y - 100, "spark", {
        lifespan: 1600,
        speed: { min: 40, max: 220 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 0.95, end: 0 },
        tint: [0xffd79a, 0xaaeeff, 0xffffff],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .explode(80);

    s.cameras.main.flash(500, 120, 100, 70);
    s.cameras.main.shake(300, 0.004);
    return true;
  }

  /** Build the stone + alive guardian textures once. */
  private static buildTextures(scene: Phaser.Scene) {
    if (scene.textures.exists("guardian-stone")) return;
    const W = 220;
    const H = 260;

    const draw = (key: string, alive: boolean) => {
      const t = scene.textures.createCanvas(key, W, H);
      if (!t) return;
      const c = t.getContext();
      c.clearRect(0, 0, W, H);
      const cx = W / 2;

      // Palette: grey stone vs living warm/violet creature
      const bodyA = alive ? "rgba(190,210,245,1)" : "rgba(96,104,118,1)";
      const bodyB = alive ? "rgba(140,160,215,1)" : "rgba(66,72,86,1)";
      const dark = alive ? "rgba(90,110,170,1)" : "rgba(44,48,60,1)";
      const legCol = alive ? "rgba(150,170,220,1)" : "rgba(70,76,90,1)";

      // Legs (4, slender)
      c.strokeStyle = legCol;
      c.lineCap = "round";
      c.lineWidth = 7;
      const legXs = [cx - 34, cx - 14, cx + 16, cx + 36];
      for (let i = 0; i < 4; i++) {
        const lx = legXs[i];
        c.beginPath();
        c.moveTo(lx, H - 92);
        c.lineTo(lx + (i < 2 ? -4 : 4), H - 4);
        c.stroke();
      }

      // Body — elongated oval
      const bg = c.createLinearGradient(0, H - 150, 0, H - 70);
      bg.addColorStop(0, bodyA);
      bg.addColorStop(1, bodyB);
      c.fillStyle = bg;
      c.beginPath();
      c.ellipse(cx, H - 108, 56, 34, -0.05, 0, Math.PI * 2);
      c.fill();

      // Chest / neck rising to the head
      c.fillStyle = bodyA;
      c.beginPath();
      c.moveTo(cx + 30, H - 120);
      c.quadraticCurveTo(cx + 70, H - 150, cx + 74, H - 196);
      c.quadraticCurveTo(cx + 60, H - 150, cx + 44, H - 120);
      c.closePath();
      c.fill();

      // Head
      c.fillStyle = bodyA;
      c.beginPath();
      c.ellipse(cx + 78, H - 206, 22, 17, 0.2, 0, Math.PI * 2);
      c.fill();
      // Snout
      c.fillStyle = bodyB;
      c.beginPath();
      c.ellipse(cx + 96, H - 198, 12, 8, 0.3, 0, Math.PI * 2);
      c.fill();

      // Antlers — branching, the signature of the guardian
      c.strokeStyle = dark;
      c.lineWidth = 4;
      const ax = cx + 72;
      const ay = H - 220;
      const branch = (bx: number, by: number, ang: number, len: number, depth: number) => {
        const ex = bx + Math.cos(ang) * len;
        const ey = by + Math.sin(ang) * len;
        c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
        if (depth > 0) {
          branch(ex, ey, ang - 0.5, len * 0.6, depth - 1);
          branch(ex, ey, ang + 0.3, len * 0.55, depth - 1);
        }
      };
      branch(ax, ay, -Math.PI / 2 - 0.3, 26, 2);
      branch(ax + 14, ay, -Math.PI / 2 + 0.1, 24, 2);

      // Eye
      if (alive) {
        // glowing warm eye
        const eg = c.createRadialGradient(cx + 82, H - 208, 0, cx + 82, H - 208, 7);
        eg.addColorStop(0, "rgba(255,240,200,1)");
        eg.addColorStop(1, "rgba(255,200,120,0)");
        c.fillStyle = eg;
        c.fillRect(cx + 72, H - 218, 20, 20);
        c.fillStyle = "rgba(90,70,40,1)";
        c.beginPath(); c.arc(cx + 83, H - 208, 2.4, 0, Math.PI * 2); c.fill();
      } else {
        c.fillStyle = "rgba(28,30,38,1)";
        c.beginPath(); c.arc(cx + 83, H - 208, 2.6, 0, Math.PI * 2); c.fill();
      }

      // Markings: cracks (stone) or glowing runes (alive)
      if (alive) {
        c.strokeStyle = "rgba(150,230,255,0.7)";
        c.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) {
          const mx = cx - 30 + i * 18;
          c.beginPath(); c.moveTo(mx, H - 120); c.lineTo(mx + 4, H - 100); c.stroke();
        }
      } else {
        c.strokeStyle = "rgba(30,32,40,0.8)";
        c.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const mx = cx - 40 + Math.random() * 80;
          const my = H - 130 + Math.random() * 40;
          c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + (Math.random() - 0.5) * 20, my + Math.random() * 14); c.stroke();
        }
      }

      t.refresh();
    };

    draw("guardian-stone", false);
    draw("guardian-alive", true);
  }
}
