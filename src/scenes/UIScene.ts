import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * HUD + narration overlay. Shows the memory-seed counter, a fading controls
 * hint, and a queued narration system: GameScene emits `narrate(lines, ms)`
 * and lines are shown one at a time, each fading in, holding, and fading out.
 */
export class UIScene extends Phaser.Scene {
  private seedText!: Phaser.GameObjects.Text;
  private storyText!: Phaser.GameObjects.Text;
  private queue: { text: string; ms: number }[] = [];
  private playing = false;

  constructor() {
    super("UI");
  }

  create() {
    this.queue = [];
    this.playing = false;

    // Seed counter (top-left)
    this.add.image(44, 44, "seed-core").setDisplaySize(26, 26).setScrollFactor(0);
    this.seedText = this.add
      .text(66, 32, "0 / 0", { fontFamily: "Georgia, serif", fontSize: "22px", color: "#cfeeff" })
      .setScrollFactor(0);
    this.add
      .text(66, 58, "memory seeds", { fontFamily: "Georgia, serif", fontSize: "12px", color: "#6f93ad" })
      .setScrollFactor(0);

    // Controls hint (fades out)
    const hint = this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 34,
        "MOVE  A / D        JUMP  SPACE  (double / wall)        DASH  SHIFT        HUM  E",
        { fontFamily: "Georgia, serif", fontSize: "15px", color: "#9fc6e0" }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0.9);
    this.tweens.add({ targets: hint, alpha: 0, delay: 12000, duration: 2500 });

    // Narration line (upper third)
    this.storyText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT * 0.26, "", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#eaf6ff",
        align: "center",
        fontStyle: "italic",
        wordWrap: { width: 820 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(100)
      .setShadow(0, 0, "#3a78b0", 14, true, true);

    const game = this.scene.get("Game");
    game.events.on("seeds", (c: number, t: number) => this.seedText.setText(`${c} / ${t}`));
    game.events.on("narrate", (lines: string[], ms = 2800) => this.enqueue(lines, ms));
    // Backwards-compatible single-line story event
    game.events.on("story", (msg: string) => this.enqueue([msg], 3000));

    // Clean up listeners if the scene restarts
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => game.events.off("seeds").off("narrate").off("story"));
  }

  private enqueue(lines: string[], ms: number) {
    for (const text of lines) this.queue.push({ text, ms });
    if (!this.playing) this.playNext();
  }

  private playNext() {
    const item = this.queue.shift();
    if (!item) {
      this.playing = false;
      return;
    }
    this.playing = true;
    this.storyText.setText(item.text).setAlpha(0);
    this.tweens.add({
      targets: this.storyText,
      alpha: 1,
      duration: 700,
      hold: item.ms,
      yoyo: true,
      ease: "Sine.inOut",
      onComplete: () => this.playNext(),
    });
  }
}
