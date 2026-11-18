import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * The ending card shown after reawakening the guardian. A calm, luminous
 * close to the vertical slice: title, a closing line, drifting motes, and a
 * prompt to return to the title (which replays the slice).
 */
export class EndingScene extends Phaser.Scene {
  constructor() {
    super("Ending");
  }

  create() {
    this.cameras.main.setBackgroundColor("#02040a");
    this.cameras.main.fadeIn(1600, 2, 4, 10);

    // Soft central bloom
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, "glow-cyan")
      .setDisplaySize(560, 560)
      .setAlpha(0.22)
      .setBlendMode(Phaser.BlendModes.ADD);

    // Drifting motes
    this.add
      .particles(0, 0, "spore", {
        x: { min: 0, max: GAME_WIDTH },
        y: { min: 0, max: GAME_HEIGHT },
        lifespan: 9000,
        speedY: { min: -14, max: -4 },
        speedX: { min: -8, max: 8 },
        scale: { min: 0.4, max: 1.1 },
        alpha: { values: [0, 0.5, 0.5, 0], interpolation: "linear" },
        frequency: 120,
        quantity: 1,
        blendMode: Phaser.BlendModes.ADD,
        tint: [0x44ddff, 0xaaeeff, 0xffffff],
      })
      .setDepth(1);

    // Title + closing lines
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, "THE  FIRST  ECHO", {
        fontFamily: "Georgia, serif",
        fontSize: "46px",
        color: "#eaf6ff",
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setShadow(0, 0, "#4a90c2", 18, true, true)
      .setDepth(2);

    const lines = [
      "The guardian breathes again.",
      "One fragment of the song restored — the Hollow remembers warmth.",
      "The silence is vast. But it is no longer whole.",
    ];
    lines.forEach((line, i) => {
      const t = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.52 + i * 34, line, {
          fontFamily: "Georgia, serif",
          fontSize: "19px",
          color: "#bcd9ee",
          fontStyle: "italic",
          align: "center",
          wordWrap: { width: 820 },
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(2);
      this.tweens.add({ targets: t, alpha: 1, delay: 1000 + i * 1100, duration: 1400, ease: "Sine.inOut" });
    });

    // Credit line (honest: this is a vertical slice)
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.74, "— end of the vertical slice —", {
        fontFamily: "Georgia, serif",
        fontSize: "14px",
        color: "#5f7f98",
      })
      .setOrigin(0.5)
      .setDepth(2);

    // Prompt to replay
    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.88, "press  any  key  to  return", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#86b4d6",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(2);
    this.tweens.add({
      targets: prompt,
      alpha: 1,
      delay: 4800,
      duration: 1200,
      onComplete: () => {
        this.tweens.add({ targets: prompt, alpha: 0.3, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      },
    });

    const toTitle = () => {
      this.cameras.main.fadeOut(900, 2, 4, 10);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Title"));
    };
    // Only allow return after the prompt appears
    this.time.delayedCall(4800, () => {
      this.input.keyboard?.once("keydown", toTitle);
      this.input.once("pointerdown", toTitle);
    });
  }
}
