// Central tuning values for the whole game.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Palette — dark enchanted forest with bioluminescent cyan/white accents.
// Based on the concept art: deep blacks and dark blues for the world,
// brilliant cyan/white/purple for glow effects and Lumi.
export const COLORS = {
  // Sky & deep background
  skyTop: 0x020408,
  skyBottom: 0x0a1018,
  // Forest layers (dark → slightly lighter for parallax depth)
  farForest: 0x060c14,
  midForest: 0x0a1420,
  nearForest: 0x10202e,
  // Ground / platforms
  ground: 0x080e18,
  platform: 0x0c1620,
  platformEdge: 0x1a4060,
  platformMoss: 0x20aa80, // glowing moss-green edge accent
  // Lumi character glow
  lumi: 0xccf0ff,
  lumiCore: 0xffffff,
  lumiGlow: 0x66ccff,
  // Bioluminescent accents
  glowCyan: 0x44ddff,
  glowBlue: 0x3388ff,
  glowPurple: 0x9966ff,
  glowGreen: 0x33ffaa,
  glowWarm: 0xffdd88,
  // General
  accent: 0x55ccff,
  warm: 0xffd79a,
  seedGlow: 0xaaeeff,
  text: 0xd6ecff,
  // Fog / mist
  mist: 0x1a3050,
};

// Player movement feel.
export const MOVE = {
  accel: 2600,
  maxSpeed: 320,
  airAccel: 1800,
  friction: 2000,
  gravity: 2000,
  jumpVel: -720,
  doubleJumpVel: -640,
  maxFall: 900,
  coyoteTime: 110,
  jumpBuffer: 120,
  dashSpeed: 760,
  dashTime: 160,
  dashCooldown: 320,
  wallSlideSpeed: 120,
  wallJumpX: 420,
  wallJumpY: -680,
};
