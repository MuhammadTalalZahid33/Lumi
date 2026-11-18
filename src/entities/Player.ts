import Phaser from "phaser";
import { MOVE, COLORS } from "../config";
import { LumiRig, LumiMode } from "./LumiRig";

type Keys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  hum: Phaser.Input.Keyboard.Key;
};

/**
 * Lumi — the player.
 *
 * Architecture:
 *   - An invisible 26×30 physics sprite ("sprite") handles all collision.
 *   - LumiRig (a jointed container of painted parts) is the visual. It is
 *     positioned at the hitbox's feet every frame and never touches physics.
 */
export class Player {
  scene: Phaser.Scene;
  sprite: Phaser.Physics.Arcade.Sprite;
  private rig: LumiRig;
  light: Phaser.GameObjects.Image;
  private motes: Phaser.GameObjects.Particles.ParticleEmitter;
  private dashBurst: Phaser.GameObjects.Particles.ParticleEmitter;

  private keys!: Keys;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // movement state
  private facing = 1;
  private canDoubleJump = false;
  private lastGroundedAt = -9999;
  private lastJumpPressedAt = -9999;
  private isDashing = false;
  private lastDashAt = -9999;
  private onWall = 0;
  private wasOnGround = false;
  private airVy = 0;

  onLand?: () => void;
  onJump?: () => void;
  onDash?: () => void;
  /** Fired on a timer while Lumi hums (for resonance pulses). */
  onHum?: (x: number, y: number) => void;

  private isHumming = false;
  private humAccum = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // --- Invisible physics hitbox ---
    if (!scene.textures.exists("_playerBox")) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0xff00ff, 0);
      gfx.fillRect(0, 0, 26, 30);
      gfx.generateTexture("_playerBox", 26, 30);
      gfx.destroy();
    }
    this.sprite = scene.physics.add.sprite(x, y, "_playerBox");
    this.sprite.setVisible(false);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(26, 30);
    body.setOffset(0, 0);
    body.setMaxVelocityY(MOVE.maxFall);
    body.setCollideWorldBounds(true);

    // Wide, faint light Lumi casts on the surroundings
    this.light = scene.add
      .image(x, y, "glow-cyan")
      .setDisplaySize(220, 220)
      .setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(18);

    // Delicate motes drifting up off Lumi's fur
    this.motes = scene.add
      .particles(0, 0, "spark", {
        follow: this.sprite,
        followOffset: { x: 0, y: -8 },
        x: { min: -14, max: 14 },
        y: { min: -14, max: 6 },
        lifespan: { min: 900, max: 1600 },
        speedY: { min: -26, max: -8 },
        speedX: { min: -10, max: 10 },
        scale: { min: 0.15, max: 0.4 },
        alpha: { values: [0, 0.8, 0.5, 0], interpolation: "linear" },
        tint: [COLORS.glowCyan, 0xc8b4ff, 0xffffff],
        frequency: 110,
        blendMode: Phaser.BlendModes.ADD,
      })
      .setDepth(21);

    // Dash / jump burst (manual emit)
    this.dashBurst = scene.add
      .particles(0, 0, "spark", {
        lifespan: 500,
        speed: { min: 60, max: 240 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.8, end: 0 },
        tint: [COLORS.lumiGlow, COLORS.accent, 0xc8b4ff],
        blendMode: Phaser.BlendModes.ADD,
        emitting: false,
      })
      .setDepth(19);

    this.rig = new LumiRig(scene, x, y + 15);

    this.setupInput();
  }

  private setupInput() {
    const kb = this.scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = {
      left: kb.addKey("A"),
      right: kb.addKey("D"),
      up: kb.addKey("W"),
      jump: kb.addKey("SPACE"),
      dash: kb.addKey("SHIFT"),
      hum: kb.addKey("E"),
    };
  }

  private pressed(...keys: Phaser.Input.Keyboard.Key[]) {
    return keys.some((k) => Phaser.Input.Keyboard.JustDown(k));
  }
  private held(...keys: Phaser.Input.Keyboard.Key[]) {
    return keys.some((k) => k.isDown);
  }

  private resolveMode(onGround: boolean, vx: number, vy: number): LumiMode {
    if (this.isDashing) return "dash";
    if (this.onWall !== 0) return "wallslide";
    if (!onGround) return vy < -40 ? "jump" : "fall";
    if (this.isHumming) return "hum";
    return Math.abs(vx) > 30 ? "run" : "idle";
  }

  update(time: number, delta: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;
    const onGround = body.blocked.down || body.touching.down;

    // Jump buffer
    if (this.pressed(this.keys.jump, this.keys.up, this.cursors.up!)) {
      this.lastJumpPressedAt = time;
    }

    // Dash
    if (
      this.pressed(this.keys.dash) &&
      time - this.lastDashAt > MOVE.dashCooldown &&
      !this.isDashing
    ) {
      this.startDash(time);
    }
    if (this.isDashing && time - this.lastDashAt > MOVE.dashTime) {
      this.isDashing = false;
      body.setVelocityX(body.velocity.x * 0.4);
    }

    const left = this.held(this.keys.left, this.cursors.left!);
    const right = this.held(this.keys.right, this.cursors.right!);

    // Horizontal movement
    if (!this.isDashing) {
      const accel = onGround ? MOVE.accel : MOVE.airAccel;
      if (left && !right) {
        body.velocity.x -= accel * dt;
        this.facing = -1;
      } else if (right && !left) {
        body.velocity.x += accel * dt;
        this.facing = 1;
      } else if (onGround) {
        const f = MOVE.friction * dt;
        if (Math.abs(body.velocity.x) <= f) body.velocity.x = 0;
        else body.velocity.x -= Math.sign(body.velocity.x) * f;
      }
      body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -MOVE.maxSpeed, MOVE.maxSpeed);
    }

    // Wall detection
    this.onWall = 0;
    if (!onGround) {
      if ((body.blocked.left || body.touching.left) && left) this.onWall = -1;
      else if ((body.blocked.right || body.touching.right) && right) this.onWall = 1;
    }

    // Wall slide
    if (this.onWall !== 0 && body.velocity.y > 0) {
      body.velocity.y = Math.min(body.velocity.y, MOVE.wallSlideSpeed);
    }

    // Grounded
    if (onGround) {
      this.lastGroundedAt = time;
      this.canDoubleJump = true;
    } else {
      this.airVy = body.velocity.y; // remember impact speed for landing squash
    }

    // Jump
    const wantJump = time - this.lastJumpPressedAt <= MOVE.jumpBuffer;
    const canCoyote = time - this.lastGroundedAt <= MOVE.coyoteTime;
    if (wantJump) {
      if (onGround || canCoyote) {
        this.doJump(MOVE.jumpVel);
      } else if (this.onWall !== 0) {
        body.setVelocityX(-this.onWall * MOVE.wallJumpX);
        body.setVelocityY(MOVE.wallJumpY);
        this.facing = -this.onWall as 1 | -1;
        this.lastJumpPressedAt = -9999;
        this.canDoubleJump = true;
        this.onJump?.();
        this.puff();
      } else if (this.canDoubleJump) {
        this.canDoubleJump = false;
        this.doJump(MOVE.doubleJumpVel);
        this.rig.flip();
        this.puff();
      }
    }

    // Variable jump height
    if (!this.held(this.keys.jump, this.keys.up, this.cursors.up!) && body.velocity.y < 0) {
      body.velocity.y *= 0.86;
    }

    // Landing
    if (onGround && !this.wasOnGround) {
      this.onLand?.();
      this.rig.land(this.airVy / MOVE.maxFall);
      this.dashBurst.emitParticleAt(this.sprite.x, this.sprite.y + 14, 6);
    }
    this.wasOnGround = onGround;

    // Humming: hold E while grounded and roughly still. Emits a resonance
    // pulse on a steady beat so colour spreads outward from the song.
    this.isHumming =
      this.held(this.keys.hum) &&
      onGround &&
      !this.isDashing &&
      Math.abs(body.velocity.x) < 40;
    if (this.isHumming) {
      this.humAccum += delta;
      if (this.humAccum >= 650) {
        this.humAccum = 0;
        this.onHum?.(this.sprite.x, this.sprite.y);
      }
    } else {
      this.humAccum = 400; // next hum pulses promptly when you start
    }

    // --- Visual sync (hitbox bottom = feet) ---
    const mode = this.resolveMode(onGround, body.velocity.x, body.velocity.y);
    this.rig.setPosition(this.sprite.x, this.sprite.y + 15);
    this.rig.update(delta, mode, body.velocity.x, this.facing);
    this.light.setPosition(this.sprite.x, this.sprite.y - 6);
  }

  private startDash(time: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.isDashing = true;
    this.lastDashAt = time;
    body.setVelocityX(this.facing * MOVE.dashSpeed);
    body.setVelocityY(0);
    this.dashBurst.emitParticleAt(this.sprite.x, this.sprite.y, 18);
    this.scene.cameras.main.shake(90, 0.004);
    this.onDash?.();
  }

  private doJump(vel: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(vel);
    this.lastJumpPressedAt = -9999;
    this.lastGroundedAt = -9999;
    this.onJump?.();
  }

  private puff() {
    this.dashBurst.emitParticleAt(this.sprite.x, this.sprite.y + 10, 10);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
