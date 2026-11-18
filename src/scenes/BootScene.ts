import Phaser from "phaser";
import { TextureFactory } from "../gfx/TextureFactory";
import { generateLumiArt } from "../gfx/LumiArt";

/** Generates all procedural textures + Lumi's painted parts, then the title. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    TextureFactory.generateAll(this);
    generateLumiArt(this);
    // Dev aid: "?play" skips the title screen (used for screenshots/testing).
    const skipTitle = new URLSearchParams(window.location.search).has("play");
    // Hide the HTML loader as soon as the game is actually ready.
    const loader = document.getElementById("loader");
    if (skipTitle) loader?.remove();
    else loader?.classList.add("hidden");
    this.scene.start(skipTitle ? "Game" : "Title");
  }
}
