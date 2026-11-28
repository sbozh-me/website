import { describe, expect, it } from "vitest";

import {
  AVATAR_TINTS,
  FRAME_MS,
  REST_PHOTO,
  avatarLook,
  nextAvatarDelay,
  planAvatarBurst,
  seeded,
} from "../plan";

const photosOf = (steps: { look: { photo: number } }[]) => steps.map((s) => s.look.photo);

describe("avatar glitch plan", () => {
  it("burst frames: a glitch colour, a different-coloured echo, strips inside the circle", () => {
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      const look = avatarLook(rng, 3);
      expect(look.photo).toBe(3);
      expect(AVATAR_TINTS).toContain(look.tint);
      expect(look.echo).not.toBeNull();
      expect(look.echo!.tint).not.toBe(look.tint);
      expect(Math.abs(look.echo!.dx)).toBeGreaterThanOrEqual(5);
      expect(Math.abs(look.echo!.dx)).toBeLessThanOrEqual(10);
      expect(look.scale).toBeGreaterThanOrEqual(1.04);
      expect(look.scale).toBeLessThanOrEqual(1.18);
      expect(look.slices.length).toBeGreaterThanOrEqual(2);
      expect(look.slices.length).toBeLessThanOrEqual(4);
      for (const slice of look.slices) {
        expect(slice.top).toBeGreaterThanOrEqual(4);
        expect(slice.bottom).toBeLessThanOrEqual(96);
        expect(slice.bottom).toBeGreaterThan(slice.top);
        expect(Math.abs(slice.dx)).toBeGreaterThanOrEqual(6);
      }
    }
  });

  it("a flip flickers into a photo, holds it clean, and glitches back to rest", () => {
    for (let seed = 1; seed < 50; seed++) {
      const steps = planAvatarBurst({ kind: "flip", photos: 18, rng: seeded(seed) });
      const holds = steps.filter((s) => s.look.echo === null);
      expect(holds.length).toBeGreaterThanOrEqual(1);
      expect(holds.length).toBeLessThanOrEqual(2);
      for (const hold of holds) {
        expect(hold.ms).toBeGreaterThanOrEqual(550);
        expect(hold.look.slices).toEqual([]);
        expect(hold.look.scale).toBe(1);
      }
      // new, rest, new, new, hold: the first photo shown is the one held
      const first = steps[0].look.photo;
      expect(photosOf(steps.slice(0, 5))).toEqual([first, REST_PHOTO, first, first, first]);
      // and it ends rest, last photo, rest
      const last = holds[holds.length - 1].look.photo;
      expect(photosOf(steps.slice(-3))).toEqual([REST_PHOTO, last, REST_PHOTO]);
      for (const step of steps.filter((s) => s.look.echo !== null)) expect(step.ms).toBe(FRAME_MS);
    }
  });

  it("a flip holding two photos shows two different ones", () => {
    const twoHolds = Array.from({ length: 50 }, (_, seed) =>
      planAvatarBurst({ kind: "flip", photos: 18, rng: seeded(seed) }),
    ).find((steps) => steps.filter((s) => s.look.echo === null).length === 2)!;
    const [a, b] = twoHolds.filter((s) => s.look.echo === null).map((s) => s.look.photo);
    expect(a).not.toBe(b);
  });

  it("a twitch flashes 2-5 different photos, frame by frame", () => {
    for (let seed = 1; seed < 50; seed++) {
      const steps = planAvatarBurst({ kind: "twitch", photos: 18, rng: seeded(seed) });
      expect(steps.length).toBeGreaterThanOrEqual(2);
      expect(steps.length).toBeLessThanOrEqual(5);
      const photos = photosOf(steps);
      expect(new Set(photos).size).toBe(photos.length);
      expect(photos.every((p) => p >= 0 && p < 18)).toBe(true);
      expect(steps.every((s) => s.ms === FRAME_MS)).toBe(true);
    }
  });

  it("with fewer photos than a twitch wants, it shows them again", () => {
    for (let seed = 1; seed < 30; seed++) {
      const one = planAvatarBurst({ kind: "twitch", photos: 1, rng: seeded(seed) });
      expect(one.length).toBeGreaterThanOrEqual(2);
      expect(photosOf(one).every((photo) => photo === 0)).toBe(true);

      // all of them before any repeats
      const two = photosOf(planAvatarBurst({ kind: "twitch", photos: 2, rng: seeded(seed) }));
      expect(new Set(two.slice(0, 2))).toEqual(new Set([0, 1]));
    }
  });

  it("shots are painted in glitch colours; the resting photo keeps its own", () => {
    for (let seed = 1; seed < 30; seed++) {
      for (const step of planAvatarBurst({ kind: "flip", photos: 18, rng: seeded(seed) })) {
        if (step.look.photo === REST_PHOTO) expect(step.look.tint).toBeNull();
        else expect(AVATAR_TINTS).toContain(step.look.tint);
      }
    }
  });

  it("without photos it glitches the resting photo: in glitch colours as the shot, its own as the rest", () => {
    for (let seed = 1; seed < 30; seed++) {
      const steps = planAvatarBurst({ kind: "flip", photos: 0, rng: seeded(seed) });
      expect(steps.every((s) => s.look.photo === REST_PHOTO)).toBe(true);
      const tinted = steps.map((s) => s.look.tint !== null);
      // shot, rest, shot, shot, hold ... rest, shot, rest
      expect(tinted.slice(0, 5)).toEqual([true, false, true, true, true]);
      expect(tinted.slice(-3)).toEqual([false, true, false]);
      expect(steps.filter((s) => s.look.echo === null).every((s) => s.ms >= 550)).toBe(true);

      const twitch = planAvatarBurst({ kind: "twitch", photos: 0, rng: seeded(seed) });
      expect(twitch.length).toBeGreaterThanOrEqual(2);
      expect(twitch.every((s) => s.look.photo === REST_PHOTO && s.look.tint !== null)).toBe(true);
    }
  });

  /** Every look of flips and twitches over seeds 1-29 with these moves. */
  const looksWith = (moves: Parameters<typeof planAvatarBurst>[0]["moves"], photos = 0) =>
    Array.from({ length: 29 }, (_, i) =>
      (["flip", "twitch"] as const).flatMap((kind) =>
        planAvatarBurst({ kind, photos, moves, rng: seeded(i + 1) }).map((s) => s.look),
      ),
    ).flat();

  it("rotate turns every frame, holds included, 15-180 degrees either way", () => {
    const angles = looksWith({ rotate: true }).map((look) => look.rotate);
    for (const angle of angles) {
      expect(Math.abs(angle)).toBeGreaterThanOrEqual(15);
      expect(Math.abs(angle)).toBeLessThanOrEqual(180);
    }
    expect(angles.some((a) => a < 0)).toBe(true);
    expect(angles.some((a) => a > 0)).toBe(true);
    expect(new Set(angles).size).toBeGreaterThan(50);
  });

  it('reflect "any" mirrors frames left to right, upside down, both or neither, at random', () => {
    const looks = looksWith({ reflect: "any" });
    const mirrors = new Set(looks.map((look) => `${look.mirrorX}/${look.mirrorY}`));
    expect(mirrors).toEqual(new Set(["true/true", "true/false", "false/true", "false/false"]));
  });

  it('reflect "sideways" mirrors frames left to right or not, never upside down', () => {
    const looks = looksWith({ reflect: "sideways" }, 18);
    expect(looks.every((look) => !look.mirrorY)).toBe(true);
    expect(new Set(looks.map((look) => look.mirrorX))).toEqual(new Set([true, false]));
  });

  it("scale blows every frame up, holds included, 110% to 200%, never smaller", () => {
    const looks = looksWith({ scale: true });
    for (const look of looks) {
      expect(look.scale).toBeGreaterThanOrEqual(1.1);
      expect(look.scale).toBeLessThanOrEqual(2);
    }
    expect(looks.some((look) => look.scale < 1.3)).toBe(true);
    expect(looks.some((look) => look.scale > 1.8)).toBe(true);
    // the holds are sized too, not left at 1
    expect(looks.filter((look) => look.echo === null).some((look) => look.scale !== 1)).toBe(true);
  });

  it("without moves nothing turns or mirrors, and the scale only jumps a little", () => {
    for (const look of looksWith(undefined, 18)) {
      expect(look.rotate).toBe(0);
      expect(look.mirrorX).toBe(false);
      expect(look.mirrorY).toBe(false);
      if (look.echo === null) expect(look.scale).toBe(1);
      else expect(look.scale).toBeLessThanOrEqual(1.18);
    }
  });

  it("waits 2.5-7s between bursts", () => {
    const rng = seeded(9);
    for (let i = 0; i < 200; i++) {
      const ms = nextAvatarDelay(rng);
      expect(ms).toBeGreaterThanOrEqual(2500);
      expect(ms).toBeLessThan(7000);
    }
  });
});
