/**
 * Pure timing and look of glitch bursts, ported from media/pan-dude/glitch.py.
 * Kept free of React/DOM so it can be tested with a seeded rng.
 */

export const FRAME_MS = 1000 / 24;

export type Rng = () => number;

/** Horizontal strip of the word (top/bottom in % of its height) shifted by dx px. */
export interface Slice {
  top: number;
  bottom: number;
  dx: number;
}

/**
 * How a copy of the word is painted:
 * rest   - base colour, calm
 * gold   - accent fill, obsidian outline
 * hollow - obsidian fill, base-colour outline
 * base   - base fill, obsidian outline (burst frame that keeps the colour)
 */
export type Tone = "rest" | "gold" | "hollow" | "base";

export interface Look {
  tone: Tone;
  scale: number;
  dx: number;
  dy: number;
  /** Offset of the teal echo in px; the obsidian echo sits at -echo/2. null = no echoes. */
  echo: number | null;
  slices: Slice[];
}

export interface Step {
  state: number;
  ms: number;
  /** Burst look for this step; undefined = the calm resting look. */
  look?: Look;
}

export interface Burst {
  steps: Step[];
  /** State shown once the burst is over. */
  rest: number;
}

/**
 * twitch - the word glitches but doesn't change
 * flip   - flicker through every other state, holding each, then glitch back to state 0
 * toggle - flicker into the next state and stay there (DICK PITCH colour flip)
 */
export type BurstKind = "twitch" | "flip" | "toggle";

export function randInt(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function sign(rng: Rng) {
  return rng() < 0.5 ? -1 : 1;
}

// Strips are in % of the line box. With the blog's ~1.8 line-height the capitals
// sit at roughly 30-70%, so strips outside that range would cut empty space.
const GLYPH_TOP = 28;
const GLYPH_BOTTOM = 72;

function bands(
  rng: Rng,
  count: number,
  [minHeight, maxHeight]: [number, number],
  [top, bottom] = [GLYPH_TOP, GLYPH_BOTTOM],
): Array<[number, number]> {
  return Array.from({ length: count }, () => {
    const start = top + rng() * (bottom - top - maxHeight);
    return [start, start + randInt(rng, minHeight, maxHeight)];
  });
}

/**
 * Resting notch: one strip across the upper half of the letters, nudged 2px.
 * At body-text size the video's two 1-2px strips read as a strikethrough, so the
 * notch is thicker, single and kept off the x-height middle.
 */
export function notches(rng: Rng): Slice[] {
  return bands(rng, 1, [9, 11], [32, 54]).map(([top, bottom]) => ({
    top,
    bottom,
    dx: pick(rng, [-2, 2]),
  }));
}

/** One burst frame: scale jump, colour swap, echoes and hard slices. */
export function burstLook(rng: Rng): Look {
  return {
    tone: pick(rng, ["gold", "hollow", "base"] as const),
    scale: randInt(rng, 110, 128) / 100,
    dx: randInt(rng, -6, 6),
    dy: randInt(rng, -3, 2),
    echo: sign(rng) * randInt(rng, 6, 10),
    slices: bands(rng, 3, [6, 14]).map(([top, bottom]) => ({
      top,
      bottom,
      dx: sign(rng) * randInt(rng, 5, 12),
    })),
  };
}

function frames(rng: Rng, states: number[]): Step[] {
  return states.map((state) => ({ state, ms: FRAME_MS, look: burstLook(rng) }));
}

/** How long a state is held clean during a flip so it can be read. */
export function holdMs(length: number, blink = false) {
  if (blink) return 450;
  return Math.min(2200, Math.max(700, 450 + 55 * length));
}

export interface PlanOptions {
  kind: BurstKind;
  from: number;
  count: number;
  rng: Rng;
  /** Clean hold after each flip into state i. */
  hold?: (state: number) => number;
}

export function planBurst({ kind, from, count, rng, hold = () => 0 }: PlanOptions): Burst {
  if (kind === "twitch" || count < 2) {
    return { steps: frames(rng, Array(randInt(rng, 2, 5)).fill(from)), rest: from };
  }

  if (kind === "toggle") {
    const to = (from + 1) % count;
    return { steps: frames(rng, [to, from, to, to]), rest: to };
  }

  // Flicker new, old, new, new (as in the video), hold it, move on to the next state
  const steps: Step[] = [];
  let previous = from;
  for (let state = 0; state < count; state++) {
    if (state === from) continue;
    steps.push(...frames(rng, [state, previous, state, state]));
    const ms = hold(state);
    if (ms > 0) steps.push({ state, ms });
    previous = state;
  }
  steps.push(...frames(rng, [from, previous, from]));
  return { steps, rest: from };
}

/** Pause before the next random burst while the word is on screen. */
export function nextDelay(rng: Rng, blink: boolean) {
  return blink ? 1200 + rng() * 1400 : 4000 + rng() * 6000;
}

/** Random bursts mostly show the second meaning; some just twitch. Blink always flips. */
export function randomKind(rng: Rng, blink: boolean): "twitch" | "flip" {
  return blink || rng() < 0.6 ? "flip" : "twitch";
}

/** Deterministic rng (mulberry32) for tests. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mergeSlices(slices: Slice[]): Array<[number, number]> {
  const merged: Array<[number, number]> = [];
  for (const { top, bottom } of [...slices].sort((a, b) => a.top - b.top)) {
    const last = merged[merged.length - 1];
    if (last && top <= last[1]) last[1] = Math.max(last[1], bottom);
    else merged.push([top, bottom]);
  }
  return merged;
}

// Horizontal clip bounds reach past the box so outlines and italics aren't cut off
const LEFT = "-20%";
const RIGHT = "120%";

/** clip-path polygon that removes the given strips from the element. */
export function withoutSlices(slices: Slice[]) {
  if (slices.length === 0) return undefined;
  const points = [`${LEFT} -20%`, `${RIGHT} -20%`];
  for (const [top, bottom] of mergeSlices(slices)) {
    points.push(`${RIGHT} ${top}%`, `${LEFT} ${top}%`, `${LEFT} ${bottom}%`, `${RIGHT} ${bottom}%`);
  }
  points.push(`${RIGHT} 120%`, `${LEFT} 120%`);
  return `polygon(${points.join(", ")})`;
}

/** clip-path that keeps only one strip. */
export function onlySlice({ top, bottom }: Slice) {
  return `inset(${top}% -20% ${100 - bottom}% -20%)`;
}
