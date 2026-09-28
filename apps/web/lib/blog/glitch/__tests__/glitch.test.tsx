import { act, fireEvent, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Censor } from "../censor";
import { DickPitch, Glitch, GlitchState, SPIN_TURNS } from "../glitch";
import { seeded } from "../plan";

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

beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  window.IntersectionObserver = ControlledObserver as unknown as typeof IntersectionObserver;
  mockReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
  window.IntersectionObserver = originalObserver;
});

function word(blink = false) {
  return (
    <Glitch blink={blink} rng={seeded(1)}>
      <GlitchState>себя</GlitchState>
      <GlitchState>US</GlitchState>
    </Glitch>
  );
}

const visibleText = (container: HTMLElement) =>
  container.querySelector(".glitch-copy:not(.glitch-echo)")?.textContent;

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("Censor", () => {
  it("renders the logo glyph with a copyable ✳", () => {
    expect(renderToStaticMarkup(<Censor />)).toBe('<span class="censor">✳</span>');
  });
});

describe("Glitch", () => {
  it("server-renders the base state calmly with the real text in the flow", () => {
    const html = renderToStaticMarkup(word());
    const div = document.createElement("div");
    div.innerHTML = html;
    expect(div.querySelector(".glitch-sizer")?.textContent).toBe("себя");
    expect(div.querySelector(".glitch-layers")?.getAttribute("aria-hidden")).toBe("true");
    expect(div.querySelector(".glitch-echo")).toBeNull();
    expect(visibleText(div)).toBe("себя");
    expect(div.querySelector("[data-tone]")?.getAttribute("data-tone")).toBe("rest");
  });

  it("adds resting notches after mount", () => {
    const { container } = render(word());
    // main copy + 1 notch slice
    expect(container.querySelectorAll(".glitch-copy[data-tone='rest']")).toHaveLength(2);
    expect(container.querySelector<HTMLElement>(".glitch-copy")?.style.clipPath).toContain("polygon(");
  });

  it("renders nothing without states", () => {
    const { container } = render(<Glitch />);
    expect(container.innerHTML).toBe("");
  });

  it("flips to the alt on scroll-in, holds it, then comes back to base", () => {
    const { container } = render(word());
    setVisible(true);

    expect(container.querySelector("[data-bursting]")).not.toBeNull();
    expect(container.querySelector(".glitch-echo")).not.toBeNull();
    expect(visibleText(container)).toBe("US");

    expect(container.querySelector("[data-cover]")).toBeNull();

    // after the 4-frame flicker the alt is held clean, backed so it covers the neighbours
    advance(4 * (1000 / 24) + 1);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(visibleText(container)).toBe("US");
    expect(container.querySelector(".glitch-copy[data-cover]")).not.toBeNull();

    advance(3000);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(visibleText(container)).toBe("себя");
    expect(container.querySelector("[data-cover]")).toBeNull();
    // the sizer never changes
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("себя");
  });

  it("keeps bursting at random while visible and stops when scrolled away", () => {
    const { container } = render(word());
    setVisible(true);
    advance(3000);
    expect(container.querySelector("[data-bursting]")).toBeNull();

    // some burst happens within the 4-10s window
    let burst = false;
    for (let t = 0; t < 10_500 && !burst; t += 20) {
      advance(20);
      burst = container.querySelector("[data-bursting]") !== null;
    }
    expect(burst).toBe(true);

    advance(5000);
    setVisible(false);
    advance(60_000);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(visibleText(container)).toBe("себя");
  });

  it("only flips on the first scroll-in", () => {
    const { container } = render(word());
    setVisible(true);
    advance(3000);
    setVisible(false);
    setVisible(true);
    expect(container.querySelector("[data-bursting]")).toBeNull();
  });

  it("bursts on hover and tap, ignoring retriggers mid-burst", () => {
    const { container } = render(word());
    const root = container.querySelector(".glitch")!;
    fireEvent.pointerEnter(root);
    expect(visibleText(container)).toBe("US");
    fireEvent.click(root);
    advance(1000 / 24 + 1);
    // still the same flicker (new, old, …), not a restarted one
    expect(visibleText(container)).toBe("себя");
    advance(3000);
    fireEvent.click(root);
    expect(container.querySelector("[data-bursting]")).not.toBeNull();
  });

  it("blinking words burst every 1.2-2.6s and always show the alt", () => {
    const { container } = render(word(true));
    setVisible(true);
    advance(2000);
    let flips = 0;
    let wasAlt = false;
    for (let t = 0; t < 15_000; t += 20) {
      advance(20);
      const alt = visibleText(container) === "US";
      if (alt && !wasAlt) flips++;
      wasAlt = alt;
    }
    expect(flips).toBeGreaterThanOrEqual(5);
  });

  it("stays still with reduced motion", () => {
    mockReducedMotion(true);
    const { container } = render(word());
    expect(observers).toHaveLength(0);
    fireEvent.pointerEnter(container.querySelector(".glitch")!);
    advance(20_000);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(visibleText(container)).toBe("себя");
  });

  it("walks through several states", () => {
    const { container } = render(
      <Glitch rng={seeded(2)}>
        <GlitchState>заметили</GlitchState>
        <GlitchState>Форточка</GlitchState>
        <GlitchState>Window</GlitchState>
      </Glitch>,
    );
    setVisible(true);
    const seen: string[] = [];
    for (let t = 0; t < 6000; t += 10) {
      const text = visibleText(container)!;
      if (seen[seen.length - 1] !== text) seen.push(text);
      advance(10);
    }
    expect(seen).toContain("Форточка");
    expect(seen).toContain("Window");
    expect(seen.indexOf("Window")).toBeGreaterThan(seen.indexOf("Форточка"));
    expect(seen[seen.length - 1]).toBe("заметили");
  });

  describe("colours and plain states", () => {
    const main = (container: HTMLElement) =>
      container.querySelector<HTMLElement>(".glitch-copy:not(.glitch-echo)")!;
    const colour = (container: HTMLElement) => main(container).style.getPropertyValue("--glitch-color");
    const flash = (container: HTMLElement) => main(container).style.getPropertyValue("--glitch-flash");

    it("base is amethyst and glitched states gold by default", () => {
      const { container } = render(word());
      expect(colour(container)).toBe("var(--glitch-base)");
      expect(flash(container)).toBe("var(--glitch-accent)");
      setVisible(true);
      advance(4 * (1000 / 24) + 1);
      expect(visibleText(container)).toBe("US");
      expect(colour(container)).toBe("var(--glitch-accent)");
      // a gold state flashes amethyst instead
      expect(flash(container)).toBe("var(--glitch-base)");
    });

    it("uses the colour a state picked", () => {
      const { container } = render(
        <Glitch rng={seeded(1)}>
          <GlitchState color="teal">себя</GlitchState>
          <GlitchState color="white">US</GlitchState>
        </Glitch>,
      );
      expect(colour(container)).toBe("var(--glitch-echo)");
      setVisible(true);
      advance(4 * (1000 / 24) + 1);
      expect(colour(container)).toBe("var(--color-foreground)");
    });

    it("supports red", () => {
      const { container } = render(
        <Glitch>
          <GlitchState color="red">камминг-ауте</GlitchState>
          <GlitchState>censored</GlitchState>
        </Glitch>,
      );
      expect(colour(container)).toBe("var(--glitch-red)");
    });

    it("ignores unknown colours", () => {
      const { container } = render(
        <Glitch>
          <GlitchState color="pink">a</GlitchState>
          <GlitchState>b</GlitchState>
        </Glitch>,
      );
      expect(colour(container)).toBe("var(--glitch-base)");
    });

    it("a plain base reads as article text: no glitch weight, colour or notch", () => {
      const { container } = render(
        <Glitch rng={seeded(1)}>
          <GlitchState plain>yes</GlitchState>
          <GlitchState>No</GlitchState>
        </Glitch>,
      );
      expect(container.querySelector(".glitch-sizer")?.hasAttribute("data-plain")).toBe(true);
      expect(main(container).hasAttribute("data-plain")).toBe(true);
      expect(colour(container)).toBe("var(--glitch-plain)");
      expect(container.querySelectorAll(".glitch-copy:not(.glitch-echo)")).toHaveLength(1);
      expect(main(container).style.clipPath).toBe("");

      // …but the frames into the glitched state still glitch
      setVisible(true);
      expect(container.querySelector("[data-bursting]")).not.toBeNull();
      expect(visibleText(container)).toBe("No");
      expect(main(container).hasAttribute("data-plain")).toBe(false);
    });

    it("a plain alt still glitches in and is held plain", () => {
      const { container } = render(
        <Glitch rng={seeded(1)}>
          <GlitchState>LOL</GlitchState>
          <GlitchState plain>yes</GlitchState>
        </Glitch>,
      );
      setVisible(true);
      expect(container.querySelector("[data-bursting]")).not.toBeNull();
      expect(visibleText(container)).toBe("yes");
      advance(4 * (1000 / 24) + 1);
      expect(container.querySelector("[data-bursting]")).toBeNull();
      expect(visibleText(container)).toBe("yes");
      expect(main(container).hasAttribute("data-plain")).toBe(true);
      expect(container.querySelectorAll(".glitch-copy:not(.glitch-echo)")).toHaveLength(1);
    });
  });

  it("stops its timers on unmount", () => {
    const { unmount } = render(word(true));
    setVisible(true);
    unmount();
    expect(() => advance(60_000)).not.toThrow();
  });
});

describe("DickPitch", () => {
  const parts = (container: HTMLElement) =>
    Array.from(container.querySelectorAll(".glitch-copy:not(.glitch-echo)")[0].querySelectorAll("[data-part]")).map(
      (el) => el.getAttribute("data-part"),
    );
  const turns = (container: HTMLElement) =>
    (container.querySelector(".glitch") as HTMLElement).style.getPropertyValue("--censor-turns");

  it("renders D✳CK in the base colour and PITCH in the accent", () => {
    const { container } = render(<DickPitch rng={seeded(3)} />);
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("D✳CK PITCH");
    expect(container.querySelector(".dick-pitch .censor")).not.toBeNull();
    expect(parts(container)).toEqual(["base", "accent"]);
    expect(turns(container)).toBe("0");
  });

  it("each burst swaps the colours, stays swapped and spins the ✳", () => {
    const { container } = render(<DickPitch rng={seeded(3)} />);
    setVisible(true);
    advance(500);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(parts(container)).toEqual(["accent", "base"]);
    expect(turns(container)).toBe(String(SPIN_TURNS));
    // same width in both colourways: never backed
    expect(container.querySelector("[data-cover]")).toBeNull();

    fireEvent.click(container.querySelector(".glitch")!);
    advance(500);
    expect(parts(container)).toEqual(["base", "accent"]);
    expect(turns(container)).toBe(String(2 * SPIN_TURNS));
  });
});
