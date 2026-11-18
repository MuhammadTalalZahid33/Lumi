import Phaser from "phaser";

/**
 * The colour-restoration mechanic, made visible.
 *
 * The world starts cold and desaturated. Wherever Lumi goes, colour and
 * life seep back. We implement this with:
 *
 *   1. A full-world "restore mask" RenderTexture. It starts empty. As Lumi
 *      moves, we stamp soft radial blobs into it, so a growing painted
 *      trail of "restored ground" builds up and persists.
 *
 *   2. The mask is drawn over the world with ADD blending and a warm/green
 *      tint, so restored areas gain a gentle glow and warmth — a readable,
 *      gradual contrast against the cold untouched world (not an abrupt
 *      colour toggle).
 *
 *   3. Expanding resonance rings pulse outward from Lumi periodically and
 *      whenever a seed is collected, selling the "song spreading" idea.
 *
 * Cheap: one RenderTexture stamped occasionally, a handful of tween rings.
 */
export class Resonance {
  private scene: Phaser.Scene;
  private mask: Phaser.GameObjects.RenderTexture;
  private stampKey = "reso-stamp";
  private ringKey = "reso-ring";
  private lastStampX = -9999;
  private lastStampY = -9999;
  private restored = 0; // rough count of stamps, for progress feel

  constructor(scene: Phaser.Scene, worldW: number, worldH: number) {
    this.scene = scene;

    // Soft blob used to paint restoration into the mask.
    if (!scene.textures.exists(this.stampKey)) {
      const size = 256;
      const t = scene.textures.createCanvas(this.stampKey, size, size);
      if (t) {
        const c = t.getContext();
        const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        // Warm-green restoration tint (life returning)
        g.addColorStop(0, "rgba(110,215,175,0.32)");
        g.addColorStop(0.4, "rgba(80,185,200,0.18)");
        g.addColorStop(0.75, "rgba(70,150,220,0.07)");
        g.addColorStop(1, "rgba(70,150,220,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, size, size);
        t.refresh();
      }
    }

    // Ring texture for the expanding pulse.
    if (!scene.textures.exists(this.ringKey)) {
      const size = 256;
      const t = scene.textures.createCanvas(this.ringKey, size, size);
      if (t) {
        const c = t.getContext();
        c.strokeStyle = "rgba(170,245,255,1)";
        c.lineWidth = 6;
        c.beginPath();
        c.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
        c.stroke();
        // soft inner falloff
        c.strokeStyle = "rgba(120,220,255,0.4)";
        c.lineWidth = 14;
        c.beginPath();
        c.arc(size / 2, size / 2, size / 2 - 16, 0, Math.PI * 2);
        c.stroke();
        t.refresh();
      }
    }

    // The persistent restore mask covering the whole world. Kept subtle so
    // it reads as "colour returning" rather than a bright wash.
    this.mask = scene.add
      .renderTexture(0, 0, worldW, worldH)
      .setOrigin(0, 0)
      .setDepth(6) // behind flora/Lumi so plants read as lit, not overexposed
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.5);
  }

  /** Call each frame with Lumi's world position. Stamps a trail of colour. */
  update(x: number, y: number) {
    const d = Phaser.Math.Distance.Between(x, y, this.lastStampX, this.lastStampY);
    if (d > 26) {
      this.mask.draw(this.stampKey, x - 128, y - 128);
      this.lastStampX = x;
      this.lastStampY = y;
      this.restored++;
    }
  }

  /** A one-off expanding ring of resonance from a point (e.g. seed pickup). */
  pulse(x: number, y: number, strength = 1) {
    // Stamp a bright burst of restoration at the point.
    this.mask.draw(this.stampKey, x - 128, y - 128);
    this.mask.draw(this.stampKey, x - 128, y - 128);

    const ring = this.scene.add
      .image(x, y, this.ringKey)
      .setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.7 * strength)
      .setDisplaySize(40, 40);
    this.scene.tweens.add({
      targets: ring,
      displayWidth: 420 * strength,
      displayHeight: 420 * strength,
      alpha: 0,
      duration: 1100,
      ease: "Cubic.out",
      onComplete: () => ring.destroy(),
    });
  }

  get restoredCount() {
    return this.restored;
  }
}
