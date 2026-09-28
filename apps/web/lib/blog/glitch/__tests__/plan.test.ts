import { describe, expect, it } from "vitest";

import {
  FRAME_MS,
  burstLook,
  holdMs,
  nextDelay,
  notches,
  onlySlice,
  planBurst,
  randInt,
  randomKind,
  seeded,
  withoutSlices,
} from "../plan";

const states = (burst: { steps: { state: number }[] }) => burst.steps.map((s) => s.state);

describe("glitch plan", () => {
  it("seeded rng is deterministic and in [0, 1)", () => {
    const a = seeded(25);
    const b = seeded(25);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it("randInt stays inclusive within bounds", () => {
    const rng = seeded(1);
    const values = Array.from({ length: 500 }, () => randInt(rng, 2, 5));
    expect(new Set(values)).toEqual(new Set([2, 3, 4, 5]));
  });

  describe("planBurst", () => {
    it("twitch glitches 2-5 frames without changing the word", () => {
      for (let seed = 0; seed < 50; seed++) {
        const burst = planBurst({ kind: "twitch", from: 0, count: 2, rng: seeded(seed) });
        expect(burst.rest).toBe(0);
        expect(burst.steps.length).toBeGreaterThanOrEqual(2);
        expect(burst.steps.length).toBeLessThanOrEqual(5);
        expect(burst.steps.every((s) => s.state === 0 && s.look && s.ms === FRAME_MS)).toBe(true);
      }
    });

    it("a single-state word can only twitch", () => {
      const burst = planBurst({ kind: "flip", from: 0, count: 1, rng: seeded(3) });
      expect(states(burst).every((s) => s === 0)).toBe(true);
    });

    it("flip flickers new, old, new, new, holds, then returns to base", () => {
      const burst = planBurst({ kind: "flip", from: 0, count: 2, rng: seeded(7), hold: () => 900 });
      expect(states(burst)).toEqual([1, 0, 1, 1, 1, 0, 1, 0]);
      expect(burst.steps[4]).toEqual({ state: 1, ms: 900 });
      expect(burst.rest).toBe(0);
    });

    it("flip walks through every state in order", () => {
      const burst = planBurst({ kind: "flip", from: 0, count: 3, rng: seeded(7), hold: () => 500 });
      expect(states(burst)).toEqual([1, 0, 1, 1, 1, 2, 1, 2, 2, 2, 0, 2, 0]);
      expect(burst.rest).toBe(0);
    });

    it("flip without a hold skips the clean step", () => {
      const burst = planBurst({ kind: "flip", from: 0, count: 2, rng: seeded(7) });
      expect(burst.steps.every((s) => s.look)).toBe(true);
    });

    it("toggle flickers into the next state and stays there", () => {
      const rng = seeded(9);
      const first = planBurst({ kind: "toggle", from: 0, count: 2, rng });
      expect(states(first)).toEqual([1, 0, 1, 1]);
      expect(first.rest).toBe(1);
      const second = planBurst({ kind: "toggle", from: first.rest, count: 2, rng });
      expect(states(second)).toEqual([0, 1, 0, 0]);
      expect(second.rest).toBe(0);
    });
  });

  it("burst looks stay within the video's ranges", () => {
    const rng = seeded(11);
    for (let i = 0; i < 200; i++) {
      const look = burstLook(rng);
      expect(["gold", "hollow", "base"]).toContain(look.tone);
      expect(look.scale).toBeGreaterThanOrEqual(1.1);
      expect(look.scale).toBeLessThanOrEqual(1.28);
      expect(Math.abs(look.dx)).toBeLessThanOrEqual(6);
      expect(look.dy).toBeGreaterThanOrEqual(-3);
      expect(look.dy).toBeLessThanOrEqual(2);
      expect(Math.abs(look.echo!)).toBeGreaterThanOrEqual(6);
      expect(Math.abs(look.echo!)).toBeLessThanOrEqual(10);
      expect(look.slices).toHaveLength(3);
      for (const slice of look.slices) {
        expect(Math.abs(slice.dx)).toBeGreaterThanOrEqual(5);
        expect(Math.abs(slice.dx)).toBeLessThanOrEqual(12);
        expect(slice.top).toBeGreaterThanOrEqual(28);
        expect(slice.bottom).toBeLessThanOrEqual(72);
        expect(slice.bottom).toBeGreaterThan(slice.top);
      }
    }
  });

  it("resting notch is one strip across the upper letters, nudged 2px", () => {
    const rng = seeded(5);
    for (let i = 0; i < 100; i++) {
      const cuts = notches(rng);
      expect(cuts).toHaveLength(1);
      const [cut] = cuts;
      expect([-2, 2]).toContain(cut.dx);
      expect(cut.bottom - cut.top).toBeGreaterThanOrEqual(9);
      expect(cut.bottom - cut.top).toBeLessThanOrEqual(11);
      expect(cut.top).toBeGreaterThanOrEqual(32);
      expect(cut.bottom).toBeLessThanOrEqual(54);
    }
  });

  it("holdMs scales with length within bounds; blink holds briefly", () => {
    expect(holdMs(2)).toBe(700);
    expect(holdMs(14)).toBe(1220);
    expect(holdMs(200)).toBe(2200);
    expect(holdMs(200, true)).toBe(450);
  });

  it("nextDelay: 4-10s normally, 1.2-2.6s when blinking", () => {
    const rng = seeded(2);
    for (let i = 0; i < 100; i++) {
      const calm = nextDelay(rng, false);
      const blink = nextDelay(rng, true);
      expect(calm).toBeGreaterThanOrEqual(4000);
      expect(calm).toBeLessThan(10000);
      expect(blink).toBeGreaterThanOrEqual(1200);
      expect(blink).toBeLessThan(2600);
    }
  });

  it("randomKind always flips when blinking and mixes otherwise", () => {
    const rng = seeded(4);
    expect(Array.from({ length: 50 }, () => randomKind(rng, true)).every((k) => k === "flip")).toBe(true);
    const kinds = new Set(Array.from({ length: 50 }, () => randomKind(rng, false)));
    expect(kinds).toEqual(new Set(["flip", "twitch"]));
  });

  describe("clip paths", () => {
    it("no slices means no clip", () => {
      expect(withoutSlices([])).toBeUndefined();
    });

    it("cuts sorted, merged strips out of the polygon", () => {
      const path = withoutSlices([
        { top: 50, bottom: 60, dx: 3 },
        { top: 20, bottom: 30, dx: -3 },
        { top: 25, bottom: 35, dx: 4 },
      ]);
      expect(path).toBe(
        "polygon(-20% -20%, 120% -20%, 120% 20%, -20% 20%, -20% 35%, 120% 35%, " +
          "120% 50%, -20% 50%, -20% 60%, 120% 60%, 120% 120%, -20% 120%)",
      );
    });

    it("keeps one strip", () => {
      expect(onlySlice({ top: 20, bottom: 30, dx: 0 })).toBe("inset(20% -20% 70% -20%)");
    });
  });
});
