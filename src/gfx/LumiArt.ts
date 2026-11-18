import Phaser from "phaser";

/**
 * Lumi's painted body parts, rendered once at boot into canvas textures.
 *
 * Lumi is assembled at runtime from these parts by LumiRig (a jointed
 * container hierarchy), so animation is smooth and continuous instead of
 * a handful of baked frames.
 *
 * Every part is drawn at LUMI_RES× supersampling, in "display pixels"
 * (ctx is pre-scaled), with:
 *   - translucent icy-blue → cyan → lavender gradients
 *   - hundreds of individual fur strands along silhouettes
 *   - baked soft glow (canvas shadowBlur) and rim light
 *   - tiny internal sparkles ("made of light")
 *
 * Side view, facing RIGHT.
 */

export const LUMI_RES = 2;

type C2D = CanvasRenderingContext2D;

// Deterministic RNG so Lumi looks identical every load.
let seed = 20261012;
function rnd() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
function rr(a: number, b: number) {
  return a + rnd() * (b - a);
}

const P = {
  core: "rgba(250,254,255,1)",
  light: "rgba(218,243,255,0.97)",
  cyan: "rgba(140,214,255,0.9)",
  lav: "rgba(178,158,255,0.72)",
};

function makeTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: C2D) => void) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, Math.ceil(w * LUMI_RES), Math.ceil(h * LUMI_RES));
  if (!t) return;
  const c = t.getContext();
  c.save();
  c.scale(LUMI_RES, LUMI_RES);
  draw(c);
  c.restore();
  t.refresh();
}

/** Add an ellipse as its own sub-path (no connecting line). */
function ell(c: C2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

interface FurOpts {
  count: number;
  len: number;
  cIn: string;
  cOut: string;
  from?: number;
  to?: number;
  width?: number;
  curl?: number;
  inset?: number;
  /** Bias added to the outward normal so fur flows (e.g. backward, toward a tip). */
  flowX?: number;
  flowY?: number;
}

/** Fur strands growing outward along an (optionally rotated) ellipse arc. */
function fur(c: C2D, cx: number, cy: number, rx: number, ry: number, rot: number, o: FurOpts) {
  const from = o.from ?? 0;
  const to = o.to ?? Math.PI * 2;
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const T = (x: number, y: number): [number, number] => [cx + x * cr - y * sr, cy + x * sr + y * cr];
  c.lineCap = "round";
  for (let i = 0; i < o.count; i++) {
    const a = from + (to - from) * ((i + rnd() * 0.9) / o.count);
    const lx = Math.cos(a) * rx;
    const ly = Math.sin(a) * ry;
    let nx = Math.cos(a) / rx;
    let ny = Math.sin(a) / ry;
    let nl = Math.hypot(nx, ny) || 1;
    nx = nx / nl + (o.flowX ?? 0);
    ny = ny / nl + (o.flowY ?? 0);
    nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const L = o.len * rr(0.45, 1.15);
    const inset = (o.inset ?? 0.55) * L;
    const bend = rr(-1, 1) * (o.curl ?? 0.4);
    const [x0, y0] = T(lx - nx * inset, ly - ny * inset);
    const [x1, y1] = T(lx + nx * L - ny * bend * L, ly + ny * L + nx * bend * L);
    const [xc, yc] = T(lx + nx * L * 0.4 - ny * bend * L * 0.3, ly + ny * L * 0.4 + nx * bend * L * 0.3);
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, o.cIn);
    g.addColorStop(1, o.cOut);
    c.strokeStyle = g;
    c.lineWidth = (o.width ?? 0.75) * rr(0.6, 1.3);
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo(xc, yc, x1, y1);
    c.stroke();
  }
}

/** Tiny internal light specks. */
function sparkles(c: C2D, cx: number, cy: number, rx: number, ry: number, n: number) {
  for (let i = 0; i < n; i++) {
    const a = rr(0, Math.PI * 2);
    const d = Math.sqrt(rnd()) * 0.8;
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const r = rr(0.25, 0.7);
    const g = c.createRadialGradient(x, y, 0, x, y, r * 3.5);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.3, "rgba(200,245,255,0.45)");
    g.addColorStop(1, "rgba(160,220,255,0)");
    c.fillStyle = g;
    c.fillRect(x - r * 3.5, y - r * 3.5, r * 7, r * 7);
  }
}

// ================================================================
// PARTS
// ================================================================

function drawBody(c: C2D) {
  const cx = 24;
  const cy = 19;
  const shape = () => {
    c.beginPath();
    ell(c, cx, cy, 13.5, 9, 0.05);
    ell(c, cx + 9, cy - 2.5, 7.5, 8.2);
    ell(c, cx - 8.5, cy + 0.5, 7.5, 7.8);
  };

  // Translucent luminous fill with baked glow
  c.save();
  c.shadowColor = "rgba(120,215,255,0.9)";
  c.shadowBlur = 7;
  const g = c.createRadialGradient(cx + 5, cy - 5, 1, cx, cy, 19);
  g.addColorStop(0, P.core);
  g.addColorStop(0.35, P.light);
  g.addColorStop(0.72, P.cyan);
  g.addColorStop(1, P.lav);
  c.fillStyle = g;
  shape();
  c.fill();
  c.restore();

  // Shading inside the silhouette
  c.save();
  shape();
  c.clip();
  const sh = c.createLinearGradient(0, cy - 10, 0, cy + 10);
  sh.addColorStop(0, "rgba(255,255,255,0.28)");
  sh.addColorStop(0.55, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(150,120,255,0.45)");
  c.fillStyle = sh;
  c.fillRect(0, 0, 48, 36);
  const bg = c.createRadialGradient(cx + 6, cy + 2, 0, cx + 6, cy + 2, 9);
  bg.addColorStop(0, "rgba(255,255,255,0.6)");
  bg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = bg;
  c.fillRect(0, 0, 48, 36);
  // faint resonance rings inside the body — "made of sound"
  c.strokeStyle = "rgba(170,235,255,0.32)";
  c.lineWidth = 0.55;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(cx - 3 + i * 2.5, cy + 1, 4 + i * 2.4, -2.5, -0.8);
    c.stroke();
  }
  c.restore();

  // Rim light along the back
  c.save();
  c.shadowColor = "rgba(140,235,255,1)";
  c.shadowBlur = 3;
  c.strokeStyle = "rgba(205,248,255,0.85)";
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(cx, cy, 13.5, 9, 0.05, Math.PI * 1.05, Math.PI * 1.75);
  c.stroke();
  c.restore();

  // Fur
  // Soft fur that flows backward along the back, not bristling outward
  fur(c, cx, cy, 13.5, 9, 0.05, { count: 34, len: 3.6, from: Math.PI * 1.0, to: Math.PI * 1.95, cIn: "rgba(232,249,255,0.55)", cOut: "rgba(150,215,255,0)", curl: 0.25, width: 0.55, flowX: -0.9 });
  fur(c, cx - 8.5, cy + 0.5, 7.5, 7.8, 0, { count: 16, len: 3.2, from: Math.PI * 0.55, to: Math.PI * 1.3, cIn: "rgba(220,240,255,0.5)", cOut: "rgba(170,150,255,0)", curl: 0.3, width: 0.55, flowX: -0.6, flowY: 0.4 });
  // Chest ruff — long, bright, fluffy, sweeping down
  fur(c, cx + 9, cy - 2.5, 7.5, 8.2, 0, { count: 26, len: 5, from: -0.5, to: 1.6, cIn: "rgba(255,255,255,0.8)", cOut: "rgba(200,240,255,0)", curl: 0.35, width: 0.8, flowY: 0.7 });
  // Belly fuzz hanging down
  fur(c, cx, cy, 13.5, 9, 0.05, { count: 18, len: 2.6, from: 0.4, to: 2.7, cIn: "rgba(210,235,255,0.5)", cOut: "rgba(170,150,255,0)", curl: 0.2, width: 0.5, flowY: 0.6 });
  sparkles(c, cx, cy, 12, 7, 8);
}

function drawHead(c: C2D) {
  const cx = 20;
  const cy = 20;
  const shape = () => {
    c.beginPath();
    ell(c, cx, cy, 12.8, 11.8);
    ell(c, cx - 4, cy + 5.5, 9.5, 6.5, 0.2); // cheek fluff mass
    ell(c, cx + 10, cy + 4, 6, 4.3, -0.1); // muzzle
  };

  c.save();
  c.shadowColor = "rgba(120,215,255,0.9)";
  c.shadowBlur = 7;
  const g = c.createRadialGradient(cx + 4, cy - 5, 1, cx, cy, 17);
  g.addColorStop(0, P.core);
  g.addColorStop(0.4, P.light);
  g.addColorStop(0.78, P.cyan);
  g.addColorStop(1, P.lav);
  c.fillStyle = g;
  shape();
  c.fill();
  c.restore();

  c.save();
  shape();
  c.clip();
  const sh = c.createLinearGradient(0, cy - 12, 0, cy + 12);
  sh.addColorStop(0, "rgba(255,255,255,0.3)");
  sh.addColorStop(0.6, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(150,120,255,0.4)");
  c.fillStyle = sh;
  c.fillRect(0, 0, 46, 40);
  // muzzle highlight
  const mg = c.createRadialGradient(cx + 10, cy + 3, 0, cx + 10, cy + 3, 4.5);
  mg.addColorStop(0, "rgba(255,255,255,0.65)");
  mg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = mg;
  c.fillRect(0, 0, 46, 40);
  // soft lavender-pink cheek blush
  const bl = c.createRadialGradient(cx + 5, cy + 5.5, 0, cx + 5, cy + 5.5, 3.6);
  bl.addColorStop(0, "rgba(225,170,255,0.4)");
  bl.addColorStop(1, "rgba(225,170,255,0)");
  c.fillStyle = bl;
  c.fillRect(0, 0, 46, 40);
  c.restore();

  // Rim light over the crown
  c.save();
  c.shadowColor = "rgba(140,235,255,1)";
  c.shadowBlur = 3;
  c.strokeStyle = "rgba(210,250,255,0.85)";
  c.lineWidth = 0.9;
  c.beginPath();
  c.arc(cx, cy, 12.6, Math.PI * 1.0, Math.PI * 1.7);
  c.stroke();
  c.restore();

  // Fur: crown/back of head, then big cheek tufts sweeping back
  fur(c, cx, cy, 12.8, 11.8, 0, { count: 26, len: 2.8, from: Math.PI * 0.9, to: Math.PI * 1.75, cIn: "rgba(232,249,255,0.55)", cOut: "rgba(150,215,255,0)", curl: 0.25, width: 0.55, flowX: -0.8 });
  // Big cheek tufts sweeping back and down — a signature of the design
  fur(c, cx - 4, cy + 5.5, 9.5, 6.5, 0.2, { count: 30, len: 5.6, from: 0.7, to: 2.9, cIn: "rgba(245,252,255,0.8)", cOut: "rgba(170,160,255,0)", curl: 0.35, width: 0.75, flowX: -0.9, flowY: 0.3 });

  // Nose and mouth
  c.fillStyle = "rgba(72,80,170,0.95)";
  c.beginPath();
  c.ellipse(cx + 15.6, cy + 2.6, 1.5, 1.05, 0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.8)";
  c.beginPath();
  c.arc(cx + 15.2, cy + 2.2, 0.35, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(90,95,175,0.6)";
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(cx + 15.2, cy + 3.7);
  c.quadraticCurveTo(cx + 14, cy + 6, cx + 12, cy + 5.5);
  c.stroke();

  // Forehead resonance mark — small glowing diamond
  c.save();
  c.shadowColor = "rgba(100,230,255,1)";
  c.shadowBlur = 4;
  c.fillStyle = "rgba(160,240,255,0.9)";
  c.beginPath();
  c.moveTo(cx + 2.5, cy - 9.8);
  c.lineTo(cx + 3.6, cy - 7.4);
  c.lineTo(cx + 2.5, cy - 5.6);
  c.lineTo(cx + 1.4, cy - 7.4);
  c.closePath();
  c.fill();
  c.restore();

  // Whiskers
  c.strokeStyle = "rgba(230,250,255,0.55)";
  c.lineWidth = 0.35;
  const wx = cx + 12;
  const wy = cy + 4.5;
  const ends: [number, number, number, number][] = [
    [cx + 19, cy + 1.5, cx + 24.5, cy + 0.5],
    [cx + 19, cy + 4.5, cx + 25, cy + 4.6],
    [cx + 18.5, cy + 7, cx + 24, cy + 8.5],
  ];
  for (const [qx, qy, ex, ey] of ends) {
    c.beginPath();
    c.moveTo(wx, wy);
    c.quadraticCurveTo(qx, qy, ex, ey);
    c.stroke();
  }

  sparkles(c, cx - 2, cy, 9, 8, 5);
}

function drawEar(c: C2D) {
  const bx = 10;
  const by = 34;
  const outer = () => {
    c.beginPath();
    c.moveTo(bx - 6.5, by);
    c.bezierCurveTo(bx - 7.5, by - 12, bx - 3, by - 24, bx + 1.5, by - 29);
    c.bezierCurveTo(bx + 4, by - 22, bx + 7.5, by - 11, bx + 6.5, by);
    c.closePath();
  };

  c.save();
  c.shadowColor = "rgba(120,215,255,0.95)";
  c.shadowBlur = 6;
  const g = c.createLinearGradient(0, by, 0, by - 29);
  g.addColorStop(0, P.light);
  g.addColorStop(0.5, "rgba(170,225,255,0.95)");
  g.addColorStop(0.85, "rgba(150,190,255,0.92)");
  g.addColorStop(1, "rgba(180,160,255,0.95)");
  c.fillStyle = g;
  outer();
  c.fill();
  c.restore();

  // Edge rim
  c.save();
  c.shadowColor = "rgba(140,235,255,1)";
  c.shadowBlur = 2.5;
  c.strokeStyle = "rgba(210,250,255,0.7)";
  c.lineWidth = 0.7;
  outer();
  c.stroke();
  c.restore();

  // Inner ear — lavender → cyan glow
  c.save();
  c.shadowColor = "rgba(110,230,255,1)";
  c.shadowBlur = 4;
  const ig = c.createLinearGradient(0, by - 1, 0, by - 23);
  ig.addColorStop(0, "rgba(215,175,255,0.9)");
  ig.addColorStop(0.5, "rgba(150,205,255,0.95)");
  ig.addColorStop(1, "rgba(120,235,255,0.95)");
  c.fillStyle = ig;
  c.beginPath();
  c.moveTo(bx - 3.6, by - 1);
  c.bezierCurveTo(bx - 4, by - 10, bx - 1.5, by - 18, bx + 1.2, by - 23);
  c.bezierCurveTo(bx + 2.8, by - 17, bx + 4.3, by - 9, bx + 3.6, by - 1);
  c.closePath();
  c.fill();
  c.restore();

  // Inner-ear fluff
  c.lineCap = "round";
  for (let i = 0; i < 16; i++) {
    const sx = bx + rr(-2.6, 2.6);
    const sy = by - rr(0.5, 9);
    const ex = sx + rr(-1.8, 1.8);
    const ey = sy - rr(3, 6.5);
    const fg = c.createLinearGradient(sx, sy, ex, ey);
    fg.addColorStop(0, "rgba(255,255,255,0.85)");
    fg.addColorStop(1, "rgba(255,255,255,0)");
    c.strokeStyle = fg;
    c.lineWidth = rr(0.4, 0.8);
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + rr(-1, 1), (sy + ey) / 2, ex, ey);
    c.stroke();
  }

  // Outer-edge fur
  fur(c, bx + 0.3, by - 12, 6.8, 15, 0.04, { count: 12, len: 1.8, from: Math.PI * 0.6, to: Math.PI * 1.4, cIn: "rgba(225,248,255,0.5)", cOut: "rgba(150,215,255,0)", curl: 0.2, width: 0.5, flowY: -0.6 });
  fur(c, bx + 0.3, by - 12, 6.8, 15, 0.04, { count: 10, len: 1.8, from: -Math.PI * 0.4, to: Math.PI * 0.4, cIn: "rgba(225,248,255,0.5)", cOut: "rgba(150,215,255,0)", curl: 0.2, width: 0.5, flowY: -0.6 });

  // Glowing tip tuft
  c.save();
  c.shadowColor = "rgba(120,235,255,1)";
  c.shadowBlur = 3;
  for (let i = 0; i < 6; i++) {
    const sx = bx + 1.5 + rr(-0.8, 0.8);
    const sy = by - 28.5;
    c.strokeStyle = "rgba(200,245,255,0.75)";
    c.lineWidth = rr(0.4, 0.7);
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + rr(-2, 1), sy - rr(1.5, 3), sx + rr(-3, 0.5), sy - rr(2.5, 4.5));
    c.stroke();
  }
  c.restore();
}

function drawEye(c: C2D) {
  const cx = 7;
  const cy = 8.3;
  const rot = -0.08;

  // Dark base with soft glow
  c.save();
  c.shadowColor = "rgba(140,180,255,0.9)";
  c.shadowBlur = 3;
  c.fillStyle = "#1a1650";
  c.beginPath();
  c.ellipse(cx, cy, 4.7, 5.7, rot, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // Iris: deep indigo → violet → luminous blue at the bottom
  const ig = c.createLinearGradient(0, cy - 5, 0, cy + 5);
  ig.addColorStop(0, "#2b2275");
  ig.addColorStop(0.45, "#5b4ad8");
  ig.addColorStop(0.8, "#7ba8ff");
  ig.addColorStop(1, "#aee6ff");
  c.fillStyle = ig;
  c.beginPath();
  c.ellipse(cx + 0.2, cy + 0.2, 4.1, 5.1, rot, 0, Math.PI * 2);
  c.fill();

  // Iris fibres
  c.lineWidth = 0.3;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    c.strokeStyle = "rgba(190,225,255,0.28)";
    c.beginPath();
    c.moveTo(cx + 0.5 + Math.cos(a) * 1.9, cy + 0.4 + Math.sin(a) * 2.6);
    c.lineTo(cx + 0.2 + Math.cos(a) * 3.7, cy + 0.2 + Math.sin(a) * 4.6);
    c.stroke();
  }

  // Pupil
  c.fillStyle = "#0c0a24";
  c.beginPath();
  c.ellipse(cx + 0.6, cy + 0.4, 1.9, 3, rot, 0, Math.PI * 2);
  c.fill();

  // Highlights — what makes the eye look alive
  c.fillStyle = "rgba(255,255,255,1)";
  c.beginPath();
  c.ellipse(cx - 1.4, cy - 2.3, 1.5, 1.9, -0.3, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(cx + 1.8, cy + 2.4, 0.75, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.6)";
  c.beginPath();
  c.arc(cx - 1.9, cy + 1.8, 0.45, 0, Math.PI * 2);
  c.fill();

  // Upper lid line + lash flick at the outer (back) corner
  c.strokeStyle = "#15123f";
  c.lineCap = "round";
  c.lineWidth = 1.2;
  c.beginPath();
  c.ellipse(cx, cy, 4.8, 5.8, rot, Math.PI * 1.12, Math.PI * 1.95);
  c.stroke();
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(cx - 4.4, cy - 2.6);
  c.quadraticCurveTo(cx - 5.8, cy - 3.6, cx - 6.4, cy - 5);
  c.stroke();
}

function drawLeg(c: C2D) {
  const x = 5;
  const y = 2;
  c.save();
  c.shadowColor = "rgba(120,210,255,0.8)";
  c.shadowBlur = 3;
  const g = c.createLinearGradient(0, y, 0, y + 14);
  g.addColorStop(0, P.light);
  g.addColorStop(0.7, P.cyan);
  g.addColorStop(1, P.core);
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - 3.2, y);
  c.quadraticCurveTo(x - 2.6, y + 7, x - 1.9, y + 11);
  c.lineTo(x + 1.9, y + 11);
  c.quadraticCurveTo(x + 2.8, y + 6, x + 3.2, y);
  c.closePath();
  c.fill();
  const pg = c.createRadialGradient(x + 0.4, y + 11.8, 0, x + 0.6, y + 12.4, 3.2);
  pg.addColorStop(0, P.core);
  pg.addColorStop(1, P.light);
  c.fillStyle = pg;
  c.beginPath();
  c.ellipse(x + 0.8, y + 12.4, 2.9, 1.9, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // toe lines
  c.strokeStyle = "rgba(120,150,230,0.45)";
  c.lineWidth = 0.35;
  for (const tx of [x + 0.4, x + 1.9]) {
    c.beginPath();
    c.moveTo(tx, y + 13.6);
    c.lineTo(tx + 0.3, y + 14.2);
    c.stroke();
  }
  // fluff at the hip
  fur(c, x, y + 2, 3.2, 2.5, 0, { count: 10, len: 2, from: Math.PI * 0.7, to: Math.PI * 2.3, cIn: "rgba(225,248,255,0.8)", cOut: "rgba(150,215,255,0)", curl: 0.4 });
}

/** Tail texture dimensions (display px). Base at x=0, tip at x=TAIL_LEN. */
export const TAIL_LEN = 60;
export const TAIL_H = 28;

/**
 * The whole tail as ONE continuous plume, painted horizontally (base at
 * left, glowing tip at right). LumiRig bends it along a curve with a
 * Phaser Rope, so it flows as a single fluffy shape.
 */
function drawTail(c: C2D) {
  const L = TAIL_LEN;
  const cy = TAIL_H / 2;
  // Half-thickness along the tail: slim root, fullest near 60%, rounded tip
  const hw = (u: number) => 2.2 + 9 * Math.sin(Math.PI * Math.min(1, Math.pow(u, 1.45)));
  const N = 40;
  const outline = () => {
    c.beginPath();
    c.moveTo(0, cy - hw(0));
    for (let i = 1; i <= N; i++) {
      const u = i / N;
      c.lineTo(u * (L - 4), cy - hw(u));
    }
    c.quadraticCurveTo(L, cy, L - 4, cy + hw(1));
    for (let i = N; i >= 0; i--) {
      const u = i / N;
      c.lineTo(u * (L - 4), cy + hw(u));
    }
    c.closePath();
  };

  // Luminous fill with baked glow
  c.save();
  c.shadowColor = "rgba(110,220,255,0.95)";
  c.shadowBlur = 6;
  const g = c.createLinearGradient(0, 0, L, 0);
  g.addColorStop(0, P.light);
  g.addColorStop(0.45, "rgba(185,232,255,0.92)");
  g.addColorStop(0.8, "rgba(140,220,255,0.92)");
  g.addColorStop(1, "rgba(225,250,255,0.98)");
  c.fillStyle = g;
  outline();
  c.fill();
  c.restore();

  // Shading: bright top, lavender underside, glowing tip
  c.save();
  outline();
  c.clip();
  const sh = c.createLinearGradient(0, cy - 11, 0, cy + 11);
  sh.addColorStop(0, "rgba(255,255,255,0.3)");
  sh.addColorStop(0.5, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(160,130,255,0.45)");
  c.fillStyle = sh;
  c.fillRect(0, 0, L, TAIL_H);
  const tg = c.createRadialGradient(L - 6, cy, 0, L - 6, cy, 14);
  tg.addColorStop(0, "rgba(240,254,255,0.95)");
  tg.addColorStop(0.5, "rgba(130,230,255,0.4)");
  tg.addColorStop(1, "rgba(120,220,255,0)");
  c.fillStyle = tg;
  c.fillRect(0, 0, L, TAIL_H);
  // inner light core
  const core = c.createLinearGradient(0, 0, L, 0);
  core.addColorStop(0, "rgba(255,255,255,0)");
  core.addColorStop(1, "rgba(255,255,255,0.5)");
  c.strokeStyle = core;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(4, cy - 0.5);
  c.quadraticCurveTo(L * 0.5, cy - 1.5, L - 5, cy);
  c.stroke();
  c.restore();

  // Fur strands flowing toward the tip along both edges
  c.lineCap = "round";
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 46; i++) {
      const u = rr(0.05, 0.97);
      const x = u * (L - 4);
      const e = cy + side * hw(u);
      const len = rr(3, 7) * (0.5 + u * 0.7);
      const x0 = x - len * 0.3;
      const y0 = e - side * rr(0.8, 2);
      const x1 = x + len;
      const y1 = e + side * rr(0.3, 2.2);
      const fg = c.createLinearGradient(x0, y0, x1, y1);
      fg.addColorStop(0, "rgba(232,250,255,0.7)");
      fg.addColorStop(1, side > 0 ? "rgba(175,150,255,0)" : "rgba(150,225,255,0)");
      c.strokeStyle = fg;
      c.lineWidth = rr(0.4, 0.8);
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + side * rr(-0.5, 1), x1, y1);
      c.stroke();
    }
  }

  // Wisps streaming off the tip
  c.save();
  c.shadowColor = "rgba(110,230,255,1)";
  c.shadowBlur = 4;
  for (let i = 0; i < 10; i++) {
    const sx = L - rr(6, 12);
    const sy = cy + rr(-5, 5);
    const ex = Math.min(L - 0.5, sx + rr(4, 9));
    const ey = sy + rr(-5, 5);
    c.strokeStyle = i % 3 === 0 ? "rgba(205,185,255,0.75)" : "rgba(175,242,255,0.8)";
    c.lineWidth = rr(0.4, 0.8);
    c.beginPath();
    c.moveTo(sx, sy);
    c.quadraticCurveTo(sx + rr(2, 4), sy + rr(-3, 3), ex, ey);
    c.stroke();
  }
  c.restore();

  sparkles(c, L * 0.62, cy, L * 0.32, 7, 14);
}

function drawAura(c: C2D) {
  const r = 32;
  const g = c.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(195,242,255,0.55)");
  g.addColorStop(0.35, "rgba(120,210,255,0.22)");
  g.addColorStop(0.7, "rgba(165,140,255,0.08)");
  g.addColorStop(1, "rgba(120,120,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, r * 2, r * 2);
}

/** Generate every Lumi part texture. Call once at boot. */
export function generateLumiArt(scene: Phaser.Scene) {
  makeTex(scene, "lumi-body", 48, 36, drawBody);
  makeTex(scene, "lumi-head", 46, 40, drawHead);
  makeTex(scene, "lumi-ear", 20, 36, drawEar);
  makeTex(scene, "lumi-eye", 14, 16, drawEye);
  makeTex(scene, "lumi-leg", 10, 18, drawLeg);
  makeTex(scene, "lumi-tail", TAIL_LEN, TAIL_H, drawTail);
  makeTex(scene, "lumi-aura", 64, 64, drawAura);
}
