import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GlitchAvatar } from "../avatar";
import { GLITCH_COLORS } from "../glitch";
import { type AvatarMoves, seeded } from "../plan";
import { setGlitchesEnabled } from "../window";

// IntersectionObserver whose callback the test drives
let observers: Array<{ callback: IntersectionObserverCallback; target?: Element }> = [];

class ControlledObserver {
  entry: { callback: IntersectionObserverCallback; target?: Element };
  constructor(callback: IntersectionObserverCallback) {
    this.entry = { callback };
    observers.push(this.entry);
  }
  observe(target: Element) {
    this.entry.target = target;
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function setVisible(isIntersecting: boolean) {
  act(() => {
    for (const { callback, target } of observers) {
      callback([{ isIntersecting, target } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  });
}

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
  }));
}

const originalObserver = window.IntersectionObserver;
const PHOTOS = ["/a.webp", "/b.webp", "/c.webp"];
const COLORS = Object.values(GLITCH_COLORS);

beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  window.IntersectionObserver = ControlledObserver as unknown as typeof IntersectionObserver;
  mockReducedMotion(false);
  act(() => setGlitchesEnabled(null));
});

afterEach(() => {
  vi.useRealTimers();
  window.IntersectionObserver = originalObserver;
  act(() => setGlitchesEnabled(null));
});

function avatar(still = false, { photos = PHOTOS, moves = {} as AvatarMoves } = {}) {
  return render(
    <GlitchAvatar rest="/rest.webp" photos={photos} moves={moves} still={still} rng={seeded(4)}>
      <img src="/rest.webp" alt="Sem Bozhyk" />
    </GlitchAvatar>,
  );
}

const root = (container: HTMLElement) => container.querySelector(".glitch-avatar") as HTMLElement;
const layers = (container: HTMLElement) => container.querySelector(".glitch-avatar-layers");
const painted = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".glitch-avatar-photo"));

/** Runs timers until the burst is over (each step is at most a second). */
function finishBurst(container: HTMLElement) {
  for (let i = 0; i < 40 && layers(container); i++) act(() => void vi.advanceTimersByTime(1000));
}

describe("GlitchAvatar", () => {
  it("keeps the resting photo in the page, alone while calm", () => {
    const { container, getByAltText } = avatar();
    expect(getByAltText("Sem Bozhyk")).toBeInTheDocument();
    expect(root(container)).toHaveAttribute("data-window", "on");
    expect(layers(container)).toBeNull();
  });

  it("glitches through the photos in glitch colours when it scrolls in, then settles", () => {
    const { container } = avatar();
    setVisible(true);
    expect(root(container)).toHaveAttribute("data-playing");

    // Run the burst frame by frame and collect what it painted
    const shown = new Set<string>();
    const tints = new Set<string>();
    for (let i = 0; i < 40 && layers(container); i++) {
      for (const layer of painted(container)) {
        shown.add(layer.style.getPropertyValue("--avatar-photo"));
        if (layer.dataset.tint) tints.add(layer.style.getPropertyValue("--avatar-tint"));
      }
      act(() => void vi.advanceTimersByTime(42));
    }
    finishBurst(container);

    expect([...shown].some((image) => PHOTOS.some((photo) => image.includes(photo)))).toBe(true);
    expect(tints.size).toBeGreaterThan(1);
    for (const tint of tints) expect(COLORS).toContain(tint);
    expect(layers(container)).toBeNull();
    expect(root(container)).not.toHaveAttribute("data-playing");
  });

  it("without photos it glitches its own, in glitch colours, turned, mirrored and scaled at random", () => {
    const { container } = avatar(false, { photos: [], moves: { rotate: true, reflect: "any", scale: true } });
    setVisible(true);
    const shown = new Set<string>();
    const tints = new Set<string>();
    const turns: number[] = [];
    const scales: Array<[number, number]> = [];
    // A few bursts, frame by frame
    for (let burst = 0; burst < 4; burst++) {
      if (burst > 0) fireEvent.pointerEnter(root(container));
      for (let i = 0; i < 40 && layers(container); i++) {
        for (const layer of painted(container)) {
          shown.add(layer.style.getPropertyValue("--avatar-photo"));
          if (layer.dataset.tint) tints.add(layer.style.getPropertyValue("--avatar-tint"));
          const transform = layer.style.transform;
          turns.push(Number(transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? NaN));
          const [, x, y] = transform.match(/scale\((-?[\d.]+), (-?[\d.]+)\)/) ?? [];
          scales.push([Number(x), Number(y)]);
        }
        act(() => void vi.advanceTimersByTime(42));
      }
      finishBurst(container);
    }

    expect([...shown]).toEqual(['url("/rest.webp")']);
    expect(tints.size).toBeGreaterThan(1);
    expect(turns.every((turn) => Math.abs(turn) >= 15 && Math.abs(turn) <= 180)).toBe(true);
    expect(new Set(turns).size).toBeGreaterThan(1);
    // mirrored: a negative scale on either axis; and blown up 110% to 200%, never smaller
    expect(scales.some(([x]) => x < 0)).toBe(true);
    expect(scales.some(([, y]) => y < 0)).toBe(true);
    expect(scales.some(([x, y]) => x > 0 && y > 0)).toBe(true);
    expect(scales.every(([x, y]) => Math.abs(x) === Math.abs(y) && Math.abs(x) >= 1.1 && Math.abs(x) <= 2)).toBe(true);
    expect(new Set(scales.map(([x]) => Math.abs(x))).size).toBeGreaterThan(3);
  });

  it("keeps glitching now and then while on screen", () => {
    const { container } = avatar();
    setVisible(true);
    finishBurst(container);
    // The next one starts within 7s (and may be over before 7s are up)
    let glitched = false;
    for (let ms = 0; ms < 7000 && !glitched; ms += 40) {
      act(() => void vi.advanceTimersByTime(40));
      glitched = layers(container) !== null;
    }
    expect(glitched).toBe(true);
  });

  it("stops glitching off screen", () => {
    const { container } = avatar();
    setVisible(true);
    finishBurst(container);
    setVisible(false);
    act(() => void vi.advanceTimersByTime(20000));
    expect(layers(container)).toBeNull();
  });

  it("glitches on hover, and a click on a running burst stops it", () => {
    const { container } = avatar();
    fireEvent.pointerEnter(root(container));
    expect(layers(container)).not.toBeNull();
    act(() => void vi.advanceTimersByTime(400));
    fireEvent.click(root(container));
    expect(layers(container)).toBeNull();
  });

  it("stands still with the window OFF", () => {
    act(() => setGlitchesEnabled(false));
    const { container } = avatar();
    expect(root(container)).toHaveAttribute("data-window", "off");
    setVisible(true);
    fireEvent.pointerEnter(root(container));
    fireEvent.click(root(container));
    act(() => void vi.advanceTimersByTime(20000));
    expect(layers(container)).toBeNull();
  });

  it("glitches right away when the window opens, and is cut when it closes", () => {
    act(() => setGlitchesEnabled(false));
    const { container } = avatar();
    setVisible(true);
    expect(layers(container)).toBeNull();

    act(() => setGlitchesEnabled(true));
    expect(layers(container)).not.toBeNull();

    act(() => setGlitchesEnabled(false));
    expect(layers(container)).toBeNull();
    act(() => void vi.advanceTimersByTime(20000));
    expect(layers(container)).toBeNull();
  });

  it("brings the photos in when the window opens", () => {
    act(() => setGlitchesEnabled(false));
    const loaded: string[] = [];
    const spy = vi.spyOn(window, "Image").mockImplementation(function () {
      const image = {} as HTMLImageElement;
      Object.defineProperty(image, "src", { set: (src: string) => loaded.push(src) });
      return image;
    });
    avatar();
    expect(loaded).toEqual([]);
    act(() => setGlitchesEnabled(true));
    expect(loaded).toEqual(PHOTOS);
    spy.mockRestore();
  });

  it("stands still with reduced motion", () => {
    mockReducedMotion(true);
    const { container } = avatar();
    setVisible(true);
    fireEvent.pointerEnter(root(container));
    act(() => void vi.advanceTimersByTime(20000));
    expect(layers(container)).toBeNull();
  });

  it("a still copy never glitches", () => {
    const { container } = avatar(true);
    expect(root(container)).toHaveAttribute("data-window", "off");
    setVisible(true);
    fireEvent.pointerEnter(root(container));
    act(() => void vi.advanceTimersByTime(20000));
    expect(layers(container)).toBeNull();
  });
});
