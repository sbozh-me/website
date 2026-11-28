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
  /** A state a flip never visits (a `>` word's text for the other window). */
  skip?: number;
}

export function planBurst({ kind, from, count, rng, hold = () => 0, skip }: PlanOptions): Burst {
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
    if (state === from || state === skip) continue;
    steps.push(...frames(rng, [state, previous, state, state]));
    const ms = hold(state);
    if (ms > 0) steps.push({ state, ms });
    previous = state;
  }
  steps.push(...frames(rng, [from, previous, from]));
  return { steps, rest: from };
}

/**
 * Pause before the next random burst while the word is on screen. Window OFF (`veiled`) a
 * blinking word waits as long as any other, and most pauses end in nothing (showsVeiled).
 */
export function nextDelay(rng: Rng, blink: boolean, veiled = false) {
  return blink && !veiled ? 1200 + rng() * 1400 : 4000 + rng() * 6000;
}

/**
 * Window OFF: does the word show its shapes when its pause is up? 3 times in 10, so a
 * word left alone shows them every 23s or so, at no rhythm. Rolled afresh every pause.
 */
export function showsVeiled(rng: Rng) {
  return rng() < 3 / 10;
}

/**
 * Window OFF: does a tap show the shapes? 73 times in 111. Rolled afresh on every
 * tap, so the same word shows or stays plain each time, never decided once.
 */
export function showsVeiledHover(rng: Rng) {
  return rng() < 73 / 111;
}

/** Random bursts mostly show the second meaning; some just twitch. Blink always flips. */
export function randomKind(rng: Rng, blink: boolean): "twitch" | "flip" {
  return blink || rng() < 0.6 ? "flip" : "twitch";
}

/* Avatar (GlitchAvatar) ------------------------------------------------- */

/** The glitch colours an avatar burst paints its photos in (GLITCH_COLORS names). */
export const AVATAR_TINTS = ["purple", "gold", "teal", "red", "pink"] as const;
export type AvatarTint = (typeof AVATAR_TINTS)[number];

/** The resting photo itself. */
export const REST_PHOTO = -1;

/** How one frame of an avatar burst is painted. */
export interface AvatarLook {
  /** Index into the avatar's photos, or REST_PHOTO. */
  photo: number;
  /** The glitch colour the photo is painted in; null keeps its own colours. */
  tint: AvatarTint | null;
  scale: number;
  dx: number;
  dy: number;
  /** Degrees the photo is turned (0 unless the avatar rotates). */
  rotate: number;
  /** Mirrored left to right / upside down (only if the avatar reflects). */
  mirrorX: boolean;
  mirrorY: boolean;
  /** A second copy in another tint, shifted sideways by dx px. null on a clean hold. */
  echo: { tint: AvatarTint; dx: number } | null;
  /** Strips of the photo (top/bottom in % of the circle) shifted sideways. */
  slices: Slice[];
}

export interface AvatarStep {
  ms: number;
  look: AvatarLook;
}

/** What else every frame of an avatar's burst does to its photo, at random. */
export interface AvatarMoves {
  /** Turns it 15 to 180 degrees either way. */
  rotate?: boolean;
  /** Mirrors it: "sideways" left to right only (or not); "any" upside down too, or both, or neither. */
  reflect?: "sideways" | "any";
  /** Blows it up to 110-200%, instead of the small scale jump. Never smaller: it fills the circle. */
  scale?: boolean;
}

/** The moves' share of a look: turn, mirror and size (`size` when the avatar doesn't scale). */
function moved(rng: Rng, { rotate, reflect, scale }: AvatarMoves, size: number) {
  return {
    rotate: rotate ? sign(rng) * randInt(rng, 15, 180) : 0,
    mirrorX: reflect ? rng() < 0.5 : false,
    mirrorY: reflect === "any" ? rng() < 0.5 : false,
    scale: scale ? randInt(rng, 110, 200) / 100 : size,
  };
}

/**
 * One avatar burst frame: a photo (`tinted`: in a glitch colour), scale jump, coloured echo,
 * hard slices, and whatever `moves` the avatar makes.
 */
export function avatarLook(rng: Rng, photo: number, tinted = true, moves: AvatarMoves = {}): AvatarLook {
  const tint = tinted ? pick(rng, AVATAR_TINTS) : null;
  return {
    photo,
    tint,
    dx: randInt(rng, -6, 6),
    dy: randInt(rng, -4, 4),
    ...moved(rng, moves, randInt(rng, 104, 118) / 100),
    echo: { tint: pick(rng, AVATAR_TINTS.filter((t) => t !== tint)), dx: sign(rng) * randInt(rng, 5, 10) },
    slices: bands(rng, randInt(rng, 2, 4), [4, 12], [4, 96]).map(([top, bottom]) => ({
      top,
      bottom,
      dx: sign(rng) * randInt(rng, 6, 18),
    })),
  };
}

/** A photo held still long enough to be seen, in one colour. */
function avatarHold(rng: Rng, photo: number, moves: AvatarMoves): AvatarStep {
  return {
    ms: randInt(rng, 550, 950),
    look: {
      photo,
      tint: pick(rng, AVATAR_TINTS),
      dx: 0,
      dy: 0,
      ...moved(rng, moves, 1),
      echo: null,
      slices: [],
    },
  };
}

/** `count` photos out of `photos`, in random order: all different while they last, then repeats. */
function pickPhotos(rng: Rng, photos: number, count: number): number[] {
  let pool: number[] = [];
  const picked: number[] = [];
  while (picked.length < count) {
    if (pool.length === 0) pool = Array.from({ length: photos }, (_, i) => i);
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * An avatar burst over `photos` photos. It always ends back on the resting photo.
 * twitch - 2 to 5 frames, each another photo in another colour
 * flip   - flicker into a photo (new, rest, new, new), hold it, maybe a second one, flicker back
 *
 * With no photos of its own, the avatar's resting photo stands in for them: painted in the
 * glitch colours, it is the "new" one, and in its own colours the rest. `moves` (turn, mirror,
 * scale) apply to every frame, the holds too.
 */
export function planAvatarBurst({
  kind,
  photos,
  rng,
  moves = {},
}: {
  kind: "twitch" | "flip";
  photos: number;
  rng: Rng;
  moves?: AvatarMoves;
}): AvatarStep[] {
  const shots = (count: number) =>
    photos > 0 ? pickPhotos(rng, photos, count) : Array<number>(count).fill(REST_PHOTO);
  const shot = (photo: number): AvatarStep => ({ ms: FRAME_MS, look: avatarLook(rng, photo, true, moves) });
  const rest = (): AvatarStep => ({ ms: FRAME_MS, look: avatarLook(rng, REST_PHOTO, false, moves) });

  if (kind === "twitch") return shots(randInt(rng, 2, 5)).map(shot);

  const steps: AvatarStep[] = [];
  let previous = rest;
  for (const photo of shots(randInt(rng, 1, 2))) {
    steps.push(shot(photo), previous(), shot(photo), shot(photo), avatarHold(rng, photo, moves));
    previous = () => shot(photo);
  }
  steps.push(rest(), previous(), rest());
  return steps;
}

/** Pause before an avatar's next burst while it's on screen. */
export function nextAvatarDelay(rng: Rng) {
  return 2500 + rng() * 4500;
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
