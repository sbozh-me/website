import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Censor } from "../censor";
import { DickPitch, GLITCH_COLORS, Glitch, GlitchState, SPIN_TURNS, Sbozhed } from "../glitch";
import { Voice } from "../voice";
import { seeded } from "../plan";
import { WindowButton, setGlitchesEnabled, useGlitchesEnabled } from "../window";

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

    it("supports pink", () => {
      const { container } = render(
        <Glitch>
          <GlitchState color="pink">летающую свинью</GlitchState>
          <GlitchState>Flying pig</GlitchState>
        </Glitch>,
      );
      expect(colour(container)).toBe("var(--glitch-pink)");
    });

    it("links are teal with the underline marker; a picked colour still wins", () => {
      const { container } = render(
        <Glitch rng={seeded(1)}>
          <GlitchState link>билета</GlitchState>
          <GlitchState link color="red">
            ticket
          </GlitchState>
        </Glitch>,
      );
      expect(colour(container)).toBe("var(--glitch-echo)");
      expect(main(container).hasAttribute("data-link")).toBe(true);
      setVisible(true);
      advance(4 * (1000 / 24) + 1);
      expect(visibleText(container)).toBe("ticket");
      expect(colour(container)).toBe("var(--glitch-red)");
      expect(main(container).hasAttribute("data-link")).toBe(true);
    });

    it("only a linked state gets the underline", () => {
      const { container } = render(
        <Glitch rng={seeded(1)}>
          <GlitchState>склад</GlitchState>
          <GlitchState link>
            <a href="/projects/tecraft">Tecraft</a>
          </GlitchState>
        </Glitch>,
      );
      expect(main(container).hasAttribute("data-link")).toBe(false);
      setVisible(true);
      advance(4 * (1000 / 24) + 1);
      expect(main(container).hasAttribute("data-link")).toBe(true);
      expect(main(container).querySelector("a")?.getAttribute("href")).toBe("/projects/tecraft");
    });

    it("ignores unknown colours", () => {
      const { container } = render(
        <Glitch>
          <GlitchState color="blue">a</GlitchState>
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

describe("Sbozhed", () => {
  const parts = (container: HTMLElement) =>
    Array.from(container.querySelectorAll(".glitch-copy:not(.glitch-echo)")[0].querySelectorAll("[data-part]")).map(
      (el) => [el.getAttribute("data-part"), el.textContent],
    );

  it("renders sbozh in the base colour and ed in the accent, as typed", () => {
    const { container } = render(<Sbozhed text="SBOZHED" rng={seeded(3)} />);
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("SBOZHED");
    expect(container.querySelector(".brand-mark.sbozhed")).not.toBeNull();
    expect(parts(container)).toEqual([
      ["base", "SBOZH"],
      ["accent", "ED"],
    ]);
  });

  it("each burst swaps the colours and keeps them", () => {
    const { container } = render(<Sbozhed rng={seeded(3)} />);
    setVisible(true);
    advance(500);
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(parts(container)).toEqual([
      ["accent", "sbozh"],
      ["base", "ed"],
    ]);
    fireEvent.click(container.querySelector(".glitch")!);
    advance(500);
    expect(parts(container)[0][0]).toBe("base");
  });
});

describe("Glitch with an open-window state (==shut|>open==)", () => {
  afterEach(() => {
    act(() => setGlitchesEnabled(null));
  });

  const vent = (windowOff = false) => (
    <Glitch openState="1" windowOff={windowOff} rng={seeded(2)}>
      <GlitchState plain>не хватает. Кто форточку закрыл?</GlitchState>
      <GlitchState>надуло.</GlitchState>
      <GlitchState color="teal">ДАЙ ДЕНЕГ</GlitchState>
    </Glitch>
  );

  it("shows the closed text on a page that starts with the window closed", () => {
    const { container } = render(vent(true));
    expect(container.textContent).toBe("не хватает. Кто форточку закрыл?");
  });

  it("rests on the > state with the window open, sized by it", () => {
    const { container } = render(vent());
    expect(visibleText(container)).toBe("надуло.");
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("надуло.");
  });

  it("swaps with the window switch", () => {
    const { container } = render(vent(true));
    act(() => setGlitchesEnabled(true));
    expect(visibleText(container)).toBe("надуло.");
    act(() => setGlitchesEnabled(false));
    expect(container.textContent).toBe("не хватает. Кто форточку закрыл?");
  });

  it("never flashes the closed text while open", () => {
    const { container } = render(vent());
    const seen = new Set<string>();
    setVisible(true);
    for (let i = 0; i < 200; i++) {
      seen.add(visibleText(container) ?? "");
      advance(50);
    }
    expect(seen.has("ДАЙ ДЕНЕГ")).toBe(true);
    expect(seen.has("не хватает. Кто форточку закрыл?")).toBe(false);
  });

  it("ignores an out-of-range openState", () => {
    const { container } = render(
      <Glitch openState="7" rng={seeded(2)}>
        <GlitchState>a</GlitchState>
        <GlitchState>b</GlitchState>
      </Glitch>,
    );
    expect(visibleText(container)).toBe("a");
  });
});

describe("Unclosable glitch with an open-window state (===Duck|context|>D✳ck===)", () => {
  afterEach(() => {
    act(() => setGlitchesEnabled(null));
  });

  const duck = () => (
    <Glitch unclosable openState="3" windowOff rng={seeded(4)}>
      <GlitchState>Duck pitch</GlitchState>
      <GlitchState color="gold">Animal farm reference</GlitchState>
      <GlitchState color="teal">NPC</GlitchState>
      <GlitchState>Dick pitch</GlitchState>
    </Glitch>
  );

  function watch(container: HTMLElement) {
    const seen = new Set<string>();
    setVisible(true);
    for (let i = 0; i < 400; i++) {
      seen.add(visibleText(container) ?? "");
      advance(50);
    }
    return seen;
  }

  it("rests on the base with the window closed, even though it keeps glitching", () => {
    const { container } = render(duck());
    expect(visibleText(container)).toBe("Duck pitch");
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("Duck pitch");
  });

  it("glitches through the context but never the > state while closed", () => {
    const { container } = render(duck());
    const seen = watch(container);
    expect(seen.has("NPC")).toBe(true);
    expect(seen.has("Dick pitch")).toBe(false);
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("Duck pitch");
  });

  it("rests on the > state once the window opens and never shows the base", () => {
    const { container } = render(duck());
    act(() => setGlitchesEnabled(true));
    expect(visibleText(container)).toBe("Dick pitch");
    const seen = watch(container);
    expect(seen.has("NPC")).toBe(true);
    expect(seen.has("Duck pitch")).toBe(false);
    act(() => setGlitchesEnabled(false));
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("Duck pitch");
  });
});

describe("Glitch with a window-button state (==a|WINDOW==)", () => {
  afterEach(() => {
    act(() => setGlitchesEnabled(null));
  });

  function Probe() {
    return <output>{useGlitchesEnabled() ? "open" : "closed"}</output>;
  }

  it("flashes a clickable, untabbable window button that flips the page window", () => {
    const { container } = render(
      <>
        <Glitch unclosable rng={seeded(3)}>
          <GlitchState>Duck pitch</GlitchState>
          <GlitchState window>
            <WindowButton inGlitch />
          </GlitchState>
        </Glitch>
        <Probe />
      </>,
    );
    setVisible(true);
    let button: HTMLButtonElement | null = null;
    for (let i = 0; i < 400 && !button; i++) {
      advance(20);
      button = container.querySelector(".glitch-copy:not(.glitch-echo) .window-toggle");
    }
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute("tabindex", "-1");
    expect(container.querySelector("output")?.textContent).toBe("open");
    fireEvent.click(button!);
    expect(container.querySelector("output")?.textContent).toBe("closed");
  });

  it("holds the window button about two seconds", () => {
    const { container } = render(
      <Glitch rng={seeded(3)}>
        <GlitchState>a</GlitchState>
        <GlitchState window>
          <WindowButton inGlitch />
        </GlitchState>
      </Glitch>,
    );
    setVisible(true);
    let shownFor = 0;
    for (let i = 0; i < 400; i++) {
      advance(20);
      if (container.querySelector(".glitch-copy:not(.glitch-echo) .window-toggle")) shownFor += 20;
    }
    expect(shownFor).toBeGreaterThanOrEqual(1800);
  });
});

describe("Clicking a running glitch", () => {
  const bursting = (container: HTMLElement) => container.querySelector(".glitch")?.hasAttribute("data-bursting");

  it("stops the burst at once and shows the resting state", () => {
    const { container } = render(word());
    setVisible(true);
    advance(400);
    // Mid-burst: the alt is held
    expect(visibleText(container)).toBe("US");
    fireEvent.click(container.querySelector(".glitch")!);
    expect(bursting(container)).toBe(false);
    expect(visibleText(container)).toBe("себя");
    // …and stays there: the rest of the burst was cancelled
    advance(1500);
    expect(visibleText(container)).toBe("себя");
  });

  it("keeps a burst the same tap just started (pointerenter, then click)", () => {
    const { container } = render(word());
    const root = container.querySelector(".glitch")!;
    fireEvent.pointerEnter(root);
    fireEvent.click(root);
    expect(bursting(container)).toBe(true);
  });

  it("starts a burst when clicked at rest", () => {
    const { container } = render(word());
    expect(bursting(container)).toBe(false);
    fireEvent.click(container.querySelector(".glitch")!);
    expect(bursting(container)).toBe(true);
  });
});

describe("Window button as the base of a > word (==WINDOW OFF|>you opened it==)", () => {
  afterEach(() => {
    act(() => setGlitchesEnabled(null));
  });

  it("is a real button while closed and disappears once the window opens", () => {
    const { container } = render(
      <p>
        Some context exists only when{" "}
        <Glitch openState="1" windowOff rng={seeded(5)}>
          <GlitchState window>
            <WindowButton off />
          </GlitchState>
          <GlitchState>you opened the window</GlitchState>
        </Glitch>
      </p>,
    );
    const button = screen.getByRole("button", { name: /Window OFF/ });
    expect(button).not.toHaveAttribute("tabindex");
    fireEvent.click(button);
    expect(container.querySelector(".window-toggle")).toBeNull();
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("you opened the window");
    // It never flashes back while open
    setVisible(true);
    for (let i = 0; i < 300; i++) {
      advance(20);
      expect(container.querySelector(".window-toggle")).toBeNull();
    }
  });
});

describe("Voice", () => {
  afterEach(() => {
    act(() => setGlitchesEnabled(null));
  });

  it("is plain text while the window is closed and takes its colour once open", () => {
    const { container } = render(
      <Voice color="teal" windowOff>
        <p>— We will Ship your message.</p>
      </Voice>,
    );
    const voice = container.querySelector(".voice") as HTMLElement;
    expect(voice.style.color).toBe("");
    act(() => setGlitchesEnabled(true));
    expect(voice.style.color).toBe(GLITCH_COLORS.teal);
    expect(voice.style.getPropertyValue("--glitch-plain")).toBe(GLITCH_COLORS.teal);
    expect(voice).toHaveTextContent("— We will Ship your message.");
  });

  it("ignores an unknown colour", () => {
    const { container } = render(
      <Voice color="orange">
        <p>text</p>
      </Voice>,
    );
    expect((container.querySelector(".voice") as HTMLElement).style.color).toBe("");
  });
});

