/**
 * "The First Echo" — the vertical-slice level.
 *
 * A hand-crafted left-to-right journey across the Hollow, in four movements:
 *   1. Waking Hollow — gentle intro, first memory seed on the ground.
 *   2. The Climb      — a vertical ascent (double-jump), second seed up high.
 *   3. The Gap        — a wide chasm that REQUIRES the dash; third seed beyond.
 *   4. The Sanctuary  — a frozen stone guardian; reaching it with all three
 *                       seeds reawakens it and cracks the silence.
 *
 * All coordinates are world-space pixels. The ground surface is y = GROUND_Y.
 * Platforms use top-left origin with width/height; the scene builds a static
 * body matching each rectangle exactly.
 */

export const GROUND_Y = 1300;

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SeedDef {
  x: number;
  y: number;
  /** The fragment of song this seed restores — shown when collected. */
  line: string;
}

export interface StoryZone {
  /** World x where the whisper triggers (once, when Lumi passes). */
  x: number;
  text: string;
}

export interface LevelData {
  name: string;
  worldW: number;
  worldH: number;
  spawn: { x: number; y: number };
  groundY: number;
  platforms: PlatformDef[];
  seeds: SeedDef[];
  guardian: { x: number; y: number };
  storyZones: StoryZone[];
  intro: string[];
  outro: string[];
}

export const FIRST_ECHO: LevelData = {
  name: "The First Echo",
  worldW: 6200,
  worldH: 1600,
  spawn: { x: 180, y: GROUND_Y - 16 },
  groundY: GROUND_Y,

  platforms: [
    // --- 1. Waking Hollow (flat intro ground) ---
    { x: 0, y: GROUND_Y, w: 1500, h: 300 },

    // --- 2. The Climb (stepped ascent, needs jumps/double-jump) ---
    { x: 1620, y: 1230, w: 220, h: 40 },
    { x: 1920, y: 1130, w: 200, h: 40 },
    { x: 2180, y: 1010, w: 190, h: 40 },
    { x: 2430, y: 880, w: 190, h: 40 },
    { x: 2250, y: 720, w: 170, h: 40 }, // back-left ledge (second seed is up here)
    { x: 2520, y: 600, w: 240, h: 40 }, // top of the climb, leads right

    // Landing ledge after the climb, before the gap
    { x: 2900, y: 700, w: 360, h: 40 },

    // --- 3. The Gap (chasm — a running jump + dash clears it) ---
    // Launch ledge top ends at x=3260. Far landing starts at x=3580, a ~320px
    // gap: too far for a plain jump, but a run-up + dash carries Lumi across.
    { x: 3580, y: 720, w: 300, h: 40 },
    { x: 3980, y: 820, w: 220, h: 40 }, // step down
    { x: 4300, y: 940, w: 220, h: 40 },

    // --- 4. The Sanctuary (final broad ground) ---
    { x: 4620, y: 1080, w: 1580, h: 520 },
  ],

  seeds: [
    { x: 760, y: GROUND_Y - 60, line: "A note returns — the memory of warmth." },
    { x: 2330, y: 660, line: "A note returns — the memory of rain on leaves." },
    { x: 3720, y: 660, line: "A note returns — the memory of a voice, almost." },
  ],

  guardian: { x: 5600, y: 1080 },

  storyZones: [
    { x: 420, text: "You wake. The world is grey, and holds its breath." },
    { x: 1700, text: "Fragments of an old song drift above the ruins. Gather them." },
    { x: 3300, text: "The ground falls away. Only speed will carry you across." },
    { x: 4900, text: "Something waits ahead — frozen mid-breath, waiting to be sung awake." },
  ],

  intro: [
    "When the Hush fell, the world forgot how to sound.",
    "Colour drained. Every living thing froze into grey stone.",
    "You are Lumi — the last living echo.",
    "Gather what remains of the song. Where you sing, the silence cracks.",
  ],

  outro: [
    "The guardian stirs. Colour spills back into its eyes.",
    "A single, low note answers yours across the Hollow.",
    "The silence has cracked — and somewhere, the world remembers.",
    "One echo. One last chance.",
  ],
};
