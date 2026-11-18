import Phaser from "phaser";
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from "../config";
import { Backdrop } from "../gfx/Backdrop";

/**
 * The title / story-intro screen. Sets the emotional tone before play:
 * atmospheric backdrop, drifting motes, title bloom, and the opening lines
 * of the story. Press any key / click to begin.
 */
export class TitleScene extends Phaser.Scene {
  private backdrop!: Backdrop;

  constructor() {
    super("Title");
  }

  create() {
    this.backdrop = new Backdrop(this);

    // Drifting warm motes for atmosphere. A gentle alpha curve (0 -> peak ->
    // 0 across the lifespan) makes them fade in and out softly.
    this.add
      .particles(0, 0, "leaf", {
        x: { min: 0, max: GAME_WIDTH },
        y: { min: 0, max: GAME_HEIGHT },
        lifespan: 9000,
        speedY: { min: -14, max: -4 },
        speedX: { min: -10, max: 10 },
        scale: { min: 0.3, max: 0.9 },
        alpha: { values: [0, 0.8, 0.8, 0], interpolation: "linear" },
        quantity: 1,
        frequency: 320,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(5);

    // Big soft bloom behind the title
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, "glow")
      .setDisplaySize(680, 680)
      .setTint(COLORS.accent)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(8);

    // A gently pulsing player-mote floating above the title
    const mote = this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT * 0.33, "lumi")
      .setDisplaySize(70, 70)
      .setDepth(12);
    this.tweens.add({
      targets: mote,
      y: mote.y - 16,
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    // Title
    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.47, "LUMI", {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "92px",
        color: "#eaf6ff",
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setShadow(0, 0, "#7fd4ff", 24, true, true);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.47 + 72, "a song against the silence", {
        fontFamily: "Georgia, serif",
        fontSize: "20px",
        color: "#9fc6e0",
        fontStyle: "italic",
      })
      .setOrigin(0.5)
      .setDepth(12);

    // Short teaser only — the full premise plays as the in-game intro.
    const lines = [
      "The last living echo, in a world gone silent.",
      "Chapter One — The First Echo",
    ];
    const storyY = GAME_HEIGHT * 0.68;
    lines.forEach((line, i) => {
      const t = this.add
        .text(GAME_WIDTH / 2, storyY + i * 30, line, {
          fontFamily: "Georgia, serif",
          fontSize: "18px",
          color: "#c6e2f5",
          align: "center",
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(12);
      this.tweens.add({
        targets: t,
        alpha: 1,
        delay: 600 + i * 900,
        duration: 1400,
        ease: "Sine.inOut",
      });
    });

    // Prompt
    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.92, "press  any  key  to  begin", {
        fontFamily: "Georgia, serif",
        fontSize: "16px",
        color: "#86b4d6",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(12);
    this.tweens.add({
      targets: prompt,
      alpha: 1,
      delay: 4200,
      duration: 1200,
      onComplete: () => {
        this.tweens.add({
          targets: prompt,
          alpha: 0.3,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      },
    });

    // Title fades in from black
    this.cameras.main.fadeIn(1400, 5, 7, 13);

    const start = () => {
      this.cameras.main.fadeOut(900, 5, 7, 13);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("Game");
      });
    };
    this.input.keyboard?.once("keydown", start);
    this.input.once("pointerdown", start);
  }

  update() {
    const cam = this.cameras.main;
    this.backdrop.update(cam.scrollX, cam.scrollY);
  }
}
