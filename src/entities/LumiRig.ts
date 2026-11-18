import Phaser from "phaser";
import { LUMI_RES, TAIL_LEN } from "../gfx/LumiArt";

const TAIL_POINTS = 14;

export type LumiMode = "idle" | "run" | "jump" | "fall" | "dash" | "wallslide" | "hum";

/** Overall on-screen scale of the rig (rig units are display pixels). */
const SCALE = 0.85;

const damp = (cur: number, target: number, k: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-k * dt));

/**
 * Lumi's visual: a jointed container hierarchy built from painted parts.
 * Purely cosmetic — it never touches physics. The root sits at Lumi's feet.
 *
 *   root (feet, handles facing + squash)
 *   ├─ aura (additive glow)
 *   └─ bodyC (body center: tilt, bob, flip spin)
 *      ├─ tailRoot → t1, t2C → t2, t3C → t3   (chained, wave-animated)
 *      ├─ far legs (tinted for depth)
 *      ├─ body
 *      ├─ near legs
 *      └─ headC → back ear, head, front ear, eye
 */
export class LumiRig {
  readonly root: Phaser.GameObjects.Container;
  private bodyC: Phaser.GameObjects.Container;
  private headC: Phaser.GameObjects.Container;
  private tailRope: Phaser.GameObjects.Rope;
  private eye: Phaser.GameObjects.Image;
  private earF: Phaser.GameObjects.Image;
  private earB: Phaser.GameObjects.Image;
  private legNF: Phaser.GameObjects.Image;
  private legNB: Phaser.GameObjects.Image;
  private legFF: Phaser.GameObjects.Image;
  private legFB: Phaser.GameObjects.Image;
  private aura: Phaser.GameObjects.Image;

  // smoothed pose parameters
  private time = 0;
  private runPhase = 0;
  private tailPhase = 0;
  private tilt = 0;
  private bodyY = 0;
  private sx = 1;
  private sy = 1;
  private headTilt = 0;
  private headY = 0;
  private ear = 0;
  private nf = 0;
  private nb = 0;
  private ff = 0;
  private fb = 0;
  private tail = -2.3;
  private tailCurl = 1.2;
  private tailAmp = 0.15;
  private tailSpeed = 2;
  private eyeOpenTarget = 1;

  // one-shot effects
  private landT = -1;
  private landStrength = 0;
  private spinT = -1;
  private blinkT = -1;
  private nextBlink = 1.5;
  private twitchT = -1;
  private nextTwitch = 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const inv = 1 / LUMI_RES;
    const img = (key: string, ox: number, oy: number, px = 0, py = 0) =>
      scene.add.image(px, py, key).setOrigin(ox, oy).setScale(inv);

    this.aura = scene.add
      .image(0, -28, "lumi-aura")
      .setDisplaySize(120, 120)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.42);

    // Tail: one painted plume bent along a spline every frame (WebGL Rope).
    // Points are in texture pixels; the rope is scaled down by LUMI_RES.
    const seg = (TAIL_LEN * LUMI_RES) / (TAIL_POINTS - 1);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < TAIL_POINTS; i++) pts.push(new Phaser.Math.Vector2(i * seg, 0));
    this.tailRope = scene.add.rope(-11, -2, "lumi-tail", undefined, pts, true).setScale(inv);

    const legOY = 2 / 18;
    this.legFB = img("lumi-leg", 0.5, legOY, -5, 5).setTint(0x9fb0ff).setAlpha(0.85);
    this.legFF = img("lumi-leg", 0.5, legOY, 8, 5).setTint(0x9fb0ff).setAlpha(0.85);
    const body = img("lumi-body", 24 / 48, 19 / 36);
    this.legNB = img("lumi-leg", 0.5, legOY, -8.5, 5.5);
    this.legNF = img("lumi-leg", 0.5, legOY, 5.5, 5.5);

    const earOY = 34 / 36;
    this.earB = img("lumi-ear", 0.5, earOY, -5, -8).setTint(0xc4c6ff).setAlpha(0.92);
    const head = img("lumi-head", 20 / 46, 20 / 40);
    this.earF = img("lumi-ear", 0.5, earOY, 2, -10);
    this.eye = img("lumi-eye", 0.5, 8.3 / 16, 6, -1);
    this.headC = scene.add.container(10, -12, [this.earB, head, this.earF, this.eye]);
    this.headC.setScale(1.12); // big-headed, cub-like proportions

    this.bodyC = scene.add.container(0, -17, [
      this.tailRope,
      this.legFB,
      this.legFF,
      body,
      this.legNB,
      this.legNF,
      this.headC,
    ]);

    this.root = scene.add.container(x, y, [this.aura, this.bodyC]).setDepth(20);
  }

  setPosition(x: number, y: number) {
    this.root.setPosition(x, y);
  }

  /** Landing squash. strength 0..1 (from impact speed). */
  land(strength: number) {
    this.landT = 0;
    this.landStrength = Phaser.Math.Clamp(strength, 0.25, 1);
  }

  /** Mid-air flip for the double jump. */
  flip() {
    this.spinT = 0;
  }

  update(dtMs: number, mode: LumiMode, vx: number, facing: number) {
    const dt = Math.min(dtMs / 1000, 0.05);
    this.time += dt;
    const t = this.time;

    // ---- target pose for the current mode ----
    let tilt = 0, bodyY = 0, sx = 1, sy = 1, head = 0, headY = 0, ear = 0;
    let nf = 0, nb = 0, ff = 0, fb = 0;
    // tail = base direction (rad, pointing back), curl = total bend toward the tip
    let tail = -2.6, curl = 1.4, tailAmp = 0.15, tailSpeed = 2, k = 10;
    let eyeOpen = 1;

    switch (mode) {
      case "idle": {
        const br = Math.sin(t * 2.4); // breathing
        sy = 1 + br * 0.022;
        sx = 1 - br * 0.012;
        headY = -br * 0.6;
        head = Math.sin(t * 1.1) * 0.035;
        tail = -2.6 + Math.sin(t * 1.3) * 0.06;
        curl = 1.5;
        tailAmp = 0.22;
        tailSpeed = 1.8;
        break;
      }
      case "run": {
        const run = Phaser.Math.Clamp(Math.abs(vx) / 320, 0, 1);
        this.runPhase += dt * (7 + run * 9);
        const ph = this.runPhase;
        const amp = 0.35 + run * 0.55;
        // negative angle = paw swings forward
        nf = -Math.sin(ph) * amp;
        ff = -Math.sin(ph + 0.6) * amp;
        nb = Math.sin(ph) * amp;
        fb = Math.sin(ph + 0.6) * amp;
        bodyY = -Math.abs(Math.sin(ph)) * (1 + run * 1.6);
        tilt = 0.04 + Math.sin(ph * 2) * 0.03 * run;
        head = -0.02 + Math.sin(ph * 2 + 0.5) * 0.03;
        headY = Math.sin(ph * 2) * 0.6;
        ear = -0.15 - run * 0.3;
        tail = -2.7 - run * 0.35;
        curl = 1.2 - run * 0.7;
        tailAmp = 0.12 + run * 0.12;
        tailSpeed = 6 + run * 6;
        k = 14;
        break;
      }
      case "jump":
        tilt = -0.22; head = -0.1; ear = -0.4;
        nf = -0.9; ff = -0.7; nb = 0.9; fb = 0.7;
        tail = -3.3; curl = 0.4; tailAmp = 0.1; tailSpeed = 5;
        sx = 0.94; sy = 1.07;
        break;
      case "fall":
        tilt = 0.12; head = 0.08; ear = 0.12 + Math.sin(t * 16) * 0.06;
        nf = -0.35; ff = -0.25; nb = 0.25; fb = 0.15;
        tail = -2.3; curl = 1.6; tailAmp = 0.25; tailSpeed = 7;
        sy = 1.03;
        break;
      case "dash":
        tilt = 0.08; head = 0.05; ear = -0.75;
        nf = -1.2; ff = -1.1; nb = 1.2; fb = 1.1;
        tail = -3.1; curl = 0.1; tailAmp = 0.06; tailSpeed = 10;
        sx = 1.22; sy = 0.84; k = 22;
        eyeOpen = 0.7;
        break;
      case "wallslide":
        tilt = -0.3; head = -0.15; ear = 0.1;
        nf = -1.3; ff = -1.1; nb = -0.2; fb = -0.1;
        tail = -2.1; curl = 1.2; tailAmp = 0.15; tailSpeed = 4;
        break;
      case "hum": {
        // Settles low, lifts head, ears perk, tail arches high and sways —
        // a little creature singing to the silence.
        const h = Math.sin(t * 9) * 0.5 + 0.5; // vocal pulsing
        sy = 0.9 + h * 0.03;
        sx = 1.05;
        bodyY = 2;
        head = -0.18 - h * 0.04;
        headY = -1 - h * 0.6;
        ear = -0.22 - h * 0.05;
        tail = -2.9; curl = 1.9; tailAmp = 0.28; tailSpeed = 3;
        nf = 0.1; ff = 0.1; nb = -0.1; fb = -0.1;
        k = 12;
        break;
      }
    }

    // ---- smooth toward the target so transitions flow ----
    this.tilt = damp(this.tilt, tilt, k, dt);
    this.bodyY = damp(this.bodyY, bodyY, k * 1.5, dt);
    this.sx = damp(this.sx, sx, k, dt);
    this.sy = damp(this.sy, sy, k, dt);
    this.headTilt = damp(this.headTilt, head, k * 0.8, dt);
    this.headY = damp(this.headY, headY, k, dt);
    this.ear = damp(this.ear, ear, k * 0.7, dt);
    this.nf = damp(this.nf, nf, k * 1.6, dt);
    this.nb = damp(this.nb, nb, k * 1.6, dt);
    this.ff = damp(this.ff, ff, k * 1.6, dt);
    this.fb = damp(this.fb, fb, k * 1.6, dt);
    this.tail = damp(this.tail, tail, 5, dt);
    this.tailCurl = damp(this.tailCurl, curl, 4, dt);
    this.tailAmp = damp(this.tailAmp, tailAmp, 4, dt);
    this.tailSpeed = damp(this.tailSpeed, tailSpeed, 4, dt);
    this.eyeOpenTarget = damp(this.eyeOpenTarget, eyeOpen, 12, dt);
    this.tailPhase += dt * this.tailSpeed;

    // ---- one-shot effects ----
    let squashX = 1;
    let squashY = 1;
    if (this.landT >= 0) {
      this.landT += dt;
      const p = this.landT / 0.26;
      if (p >= 1) this.landT = -1;
      else {
        const f = Math.sin(p * Math.PI) * this.landStrength;
        squashX = 1 + 0.2 * f;
        squashY = 1 - 0.24 * f;
      }
    }

    let spin = 0;
    if (this.spinT >= 0) {
      this.spinT += dt;
      const p = this.spinT / 0.38;
      if (p >= 1) this.spinT = -1;
      else spin = -Math.PI * 2 * (1 - Math.pow(1 - p, 3));
    }

    // Blinking (occasional double-blink)
    let blink = 1;
    this.nextBlink -= dt;
    if (this.nextBlink <= 0 && this.blinkT < 0) {
      this.blinkT = 0;
      this.nextBlink = 2.2 + Math.random() * 3.3;
    }
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const p = this.blinkT / 0.15;
      if (p >= 1) {
        this.blinkT = -1;
        if (Math.random() < 0.2) this.nextBlink = 0.22;
      } else blink = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
    }

    // Idle ear twitch
    let twitch = 0;
    if (mode === "idle") {
      this.nextTwitch -= dt;
      if (this.nextTwitch <= 0 && this.twitchT < 0) {
        this.twitchT = 0;
        this.nextTwitch = 3 + Math.random() * 4;
      }
    }
    if (this.twitchT >= 0) {
      this.twitchT += dt;
      const p = this.twitchT / 0.32;
      if (p >= 1) this.twitchT = -1;
      else twitch = Math.sin(p * Math.PI * 3) * 0.22 * (1 - p);
    }

    // ---- apply ----
    const inv = 1 / LUMI_RES;
    this.root.setScale(facing * SCALE * this.sx * squashX, SCALE * this.sy * squashY);
    this.bodyC.y = -17 + this.bodyY;
    this.bodyC.rotation = this.tilt + spin;
    this.headC.y = -12 + this.headY;
    this.headC.rotation = this.headTilt;
    this.earF.rotation = -0.12 + this.ear + twitch;
    this.earB.rotation = -0.42 + this.ear * 0.9;
    this.legNF.rotation = this.nf;
    this.legNB.rotation = this.nb;
    this.legFF.rotation = this.ff;
    this.legFB.rotation = this.fb;

    // Tail spline: heading starts at `tail`, bends by `curl` toward the tip,
    // with a travelling wave so the plume ripples from root to tip.
    const tp = this.tailPhase;
    const a = this.tailAmp;
    const pts = this.tailRope.points;
    const seg = (TAIL_LEN * LUMI_RES) / (TAIL_POINTS - 1);
    let px = 0;
    let py = 0;
    pts[0].x = 0;
    pts[0].y = 0;
    for (let i = 1; i < TAIL_POINTS; i++) {
      const u = i / (TAIL_POINTS - 1);
      const heading = this.tail + this.tailCurl * u * u + Math.sin(tp - u * 2.2) * a * (0.3 + u);
      px += Math.cos(heading) * seg;
      py += Math.sin(heading) * seg;
      pts[i].x = px;
      pts[i].y = py;
    }
    this.tailRope.setDirty();

    this.eye.setScale(inv, inv * Math.max(0.08, blink * this.eyeOpenTarget));

    const auraPulse = 0.42 + Math.sin(t * 2) * 0.05 + (mode === "dash" ? 0.15 : 0);
    this.aura.setAlpha(auraPulse);
  }
}
