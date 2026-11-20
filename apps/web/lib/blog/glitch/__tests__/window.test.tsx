import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DickPitch, Glitch, GlitchState } from "../glitch";
import { type Rng, seeded } from "../plan";
import { WindowButton, WindowToggle, setGlitchesEnabled } from "../window";

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

const originalObserver = window.IntersectionObserver;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  observers = [];
  window.IntersectionObserver = ControlledObserver as unknown as typeof IntersectionObserver;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query }));
  act(() => setGlitchesEnabled(null));
});

afterEach(() => {
  vi.useRealTimers();
  window.IntersectionObserver = originalObserver;
});

function page() {
  return render(
    <p>
      выключить левый контекст: <WindowToggle />
      Для{" "}
      <Glitch rng={seeded(1)}>
        <GlitchState>себя</GlitchState>
        <GlitchState>US</GlitchState>
      </Glitch>
      . <DickPitch rng={seeded(2)} />
    </p>,
  );
}

const glitch = (container: HTMLElement) => container.querySelector(".glitch:not(.dick-pitch)") as HTMLElement;
const button = () => screen.getByRole("button");

describe("WindowToggle", () => {
  it("starts ON with the glitches running", () => {
    const { container } = page();
    expect(button()).toHaveTextContent("Window ON");
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(glitch(container).querySelector(".glitch-layers")).not.toBeNull();
  });

  it("OFF turns every glitch word into plain text, at rest", () => {
    const { container } = page();
    fireEvent.click(button());
    expect(button()).toHaveTextContent("Window OFF");
    expect(button()).toHaveAttribute("aria-pressed", "false");

    const word = glitch(container);
    expect(word).toHaveAttribute("data-off");
    expect(word.querySelector(".glitch-layers, .glitch-sizer")).toBeNull();
    expect(word.textContent).toBe("себя");
    expect(container.querySelector("p")?.textContent).toContain("Для себя.");
  });

  it("OFF cuts a burst in progress: it was showing the other meaning", () => {
    const { container } = page();
    setVisible(true);
    expect(container.querySelector("[data-bursting]")).not.toBeNull();

    fireEvent.click(button());
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(container.querySelector(".glitch-layers")).toBeNull();
    expect(glitch(container).textContent).toBe("себя");
  });

  it("ON again brings the glitches back, still observed", () => {
    const { container } = page();
    setVisible(true);
    advance(3000);
    fireEvent.click(button());
    fireEvent.click(button());
    expect(button()).toHaveTextContent("Window ON");
    expect(glitch(container).querySelector(".glitch-layers")).not.toBeNull();

    // random bursts resume while the word is on screen
    let burst = false;
    for (let t = 0; t < 10_500 && !burst; t += 20) {
      advance(20);
      burst = container.querySelector("[data-bursting]") !== null;
    }
    expect(burst).toBe(true);
  });

  it("keeps D✳CK PITCH as a static brand mark while OFF", () => {
    const { container } = page();
    fireEvent.click(button());
    setVisible(true);
    const brand = container.querySelector(".dick-pitch") as HTMLElement;
    fireEvent.pointerEnter(brand);
    advance(30_000);
    expect(brand).toHaveAttribute("data-off");
    expect(brand).not.toHaveAttribute("data-bursting");
    expect(brand.querySelector(".glitch-layers, .glitch-rest")).toBeNull();
    expect(brand.textContent).toBe("D✳CK PITCH");
    expect(Array.from(brand.querySelectorAll("[data-part]")).map((el) => el.getAttribute("data-part"))).toEqual([
      "base",
      "accent",
    ]);
  });

  it("`windowOff` words are server-rendered plain, so nothing flashes before hydration", () => {
    const html = renderToStaticMarkup(
      <p>
        <WindowToggle off />
        <Glitch windowOff>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
        <DickPitch windowOff />
      </p>,
    );
    expect(html).toContain("Window OFF");
    expect(html).toContain('aria-pressed="false"');
    expect(html).not.toContain("glitch-layers");
    expect(html).toContain(">себя</span>");
  });

  it("`off` starts the page with the window closed", () => {
    const { container } = render(
      <p>
        <WindowToggle off /> Для{" "}
        <Glitch windowOff rng={() => 0.3}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
      </p>,
    );
    expect(button()).toHaveTextContent("Window OFF");
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(glitch(container)).toHaveAttribute("data-off");
    expect(glitch(container).textContent).toBe("себя");
    // Closed, it glitches into shapes: under the pointer, and now and then on its own
    setVisible(true);
    expect(glitch(container).querySelector(".glitch-layers")).toBeNull();
    fireEvent.pointerEnter(glitch(container));
    expect(glitch(container).querySelector(".glitch-cipher")).not.toBeNull();
    fireEvent.click(glitch(container)); // stop it

    fireEvent.click(button());
    expect(button()).toHaveTextContent("Window ON");
    expect(glitch(container).querySelector(".glitch-layers")).not.toBeNull();
    expect(glitch(container).querySelector(".glitch-cipher")).toBeNull();
  });

  describe("W hotkey", () => {
    const press = (init: KeyboardEventInit, target: EventTarget = document.body) =>
      act(() => void target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, ...init })));

    it("toggles the window, on any keyboard layout", () => {
      const { container } = page();
      expect(button()).toHaveAttribute("aria-keyshortcuts", "W");
      press({ code: "KeyW", key: "w" });
      expect(button()).toHaveTextContent("Window OFF");
      expect(glitch(container)).toHaveAttribute("data-off");
      press({ code: "KeyW", key: "ц" });
      expect(button()).toHaveTextContent("Window ON");
      press({ code: "KeyW", key: "W", shiftKey: true });
      expect(button()).toHaveTextContent("Window OFF");
    });

    it("starts from OFF on a ==WINDOW OFF== page", () => {
      render(<WindowToggle off />);
      press({ code: "KeyW", key: "w" });
      expect(button()).toHaveTextContent("Window ON");
    });

    it("ignores other keys, shortcuts, held keys and typing", () => {
      render(
        <>
          <WindowToggle />
          <input aria-label="search" />
        </>,
      );
      press({ code: "KeyQ", key: "q" });
      press({ code: "KeyW", key: "w", ctrlKey: true });
      press({ code: "KeyW", key: "w", metaKey: true });
      press({ code: "KeyW", key: "w", altKey: true });
      press({ code: "KeyW", key: "w", repeat: true });
      press({ code: "KeyW", key: "w" }, screen.getByLabelText("search"));
      expect(button()).toHaveTextContent("Window ON");
    });

    it("flips once with two toggles on the page, and stops when they're gone", () => {
      const { unmount } = render(
        <>
          <WindowToggle />
          <WindowToggle />
        </>,
      );
      press({ code: "KeyW", key: "w" });
      screen.getAllByRole("button").forEach((b) => expect(b).toHaveTextContent("Window OFF"));
      unmount();

      const { container } = render(
        <Glitch>
          <GlitchState>a</GlitchState>
          <GlitchState>b</GlitchState>
        </Glitch>,
      );
      press({ code: "KeyW", key: "w" });
      expect(glitch(container)).not.toHaveAttribute("data-off");
    });
  });

  describe("window-only text (==|text==)", () => {
    function hiddenPage(windowOff = false) {
      return render(
        <p>
          <WindowToggle off={windowOff} />
          Для себя{" "}
          <Glitch windowOnly windowOff={windowOff} rng={seeded(1)}>
            <GlitchState>(и для Дарио)</GlitchState>
          </Glitch>
          .
        </p>,
      );
    }

    it("is there, glitching, while the window is ON", () => {
      const { container } = hiddenPage();
      expect(glitch(container).querySelector(".glitch-layers")).not.toBeNull();
      expect(container.querySelector(".glitch-sizer")?.textContent).toBe("(и для Дарио)");
      setVisible(true);
      expect(glitch(container)).toHaveAttribute("data-bursting");
    });

    it("disappears with the window OFF and comes back ON", () => {
      const { container } = hiddenPage();
      fireEvent.click(button());
      expect(glitch(container)).toHaveAttribute("data-off");
      expect(glitch(container).textContent).toBe("");
      expect(container.querySelector("p")?.textContent).not.toContain("Дарио");

      fireEvent.click(button());
      expect(container.querySelector("p")?.textContent).toContain("(и для Дарио)");
    });

    it("isn't in the server HTML of a ==WINDOW OFF== page", () => {
      const html = renderToStaticMarkup(
        <p>
          <WindowToggle off />
          <Glitch windowOnly windowOff>
            <GlitchState>(и для Дарио)</GlitchState>
          </Glitch>
        </p>,
      );
      expect(html).not.toContain("Дарио");
    });
  });

  it("an unclosable glitch ignores the window: it stays readable", () => {
    const { container } = render(
      <p>
        <WindowToggle off />
        <Glitch windowOff unclosable rng={seeded(1)}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
        <Glitch windowOff rng={() => 0.3}>
          <GlitchState>a</GlitchState>
          <GlitchState>b</GlitchState>
        </Glitch>
      </p>,
    );
    const [unclosable, normal] = Array.from(container.querySelectorAll(".glitch"));
    expect(button()).toHaveTextContent("Window OFF");
    expect(unclosable).not.toHaveAttribute("data-off");
    expect(unclosable.querySelector(".glitch-layers")).not.toBeNull();
    expect(normal).toHaveAttribute("data-off");

    setVisible(true);
    expect(unclosable).toHaveAttribute("data-bursting");
    expect(unclosable.querySelector(".glitch-cipher")).toBeNull();
    expect(unclosable.querySelector(".glitch-copy:not(.glitch-echo)")?.textContent).toBe("US");
    // The other word glitches too, but into shapes: here, under the pointer
    expect(normal).not.toHaveAttribute("data-bursting");
    fireEvent.pointerEnter(normal);
    expect(normal).toHaveAttribute("data-bursting");
    expect(normal.querySelector(".glitch-copy:not(.glitch-echo) .glitch-cipher")).not.toBeNull();
  });

  it("opens the window again when the page goes away", () => {
    const { unmount } = page();
    fireEvent.click(button());
    unmount();
    const { container } = render(
      <Glitch>
        <GlitchState>a</GlitchState>
        <GlitchState>b</GlitchState>
      </Glitch>,
    );
    expect(glitch(container)).not.toHaveAttribute("data-off");
  });
});

/** Clears the hover/pause gate once, then is seeded(1): structural tests plan as before. */
function cleared(): Rng {
  const base = seeded(1);
  let gate = true;
  return () => {
    if (gate) {
      gate = false;
      return 0;
    }
    return base();
  };
}

describe("Window OFF: glitch words keep glitching, in shapes", () => {
  const SHAPES = /^[A-Z0-9]+$/;

  /** A closed page with one word; `alt` is what the window hides. */
  function closed({
    alt = <GlitchState color="teal">контекст</GlitchState>,
    rng = cleared(),
    openState,
  }: { alt?: React.ReactNode; rng?: Rng; openState?: string } = {}) {
    const { container } = render(
      <p>
        <WindowToggle off /> Для{" "}
        <Glitch windowOff rng={rng} openState={openState}>
          <GlitchState>себя</GlitchState>
          {alt}
        </Glitch>
        .
      </p>,
    );
    return container.querySelector(".glitch") as HTMLElement;
  }

  const hover = (word: HTMLElement) => fireEvent.pointerEnter(word);
  const copies = (word: HTMLElement) => Array.from(word.querySelectorAll<HTMLElement>(".glitch-copy:not(.glitch-echo)"));

  /** What the reader sees of the word at each step of `ms`: "shapes", or readable text. */
  function watch(word: HTMLElement, ms: number) {
    const seen = new Set<string>();
    for (let t = 0; t < ms; t += 20) {
      for (const copy of copies(word)) seen.add(copy.querySelector(".glitch-cipher") ? "shapes" : (copy.textContent ?? ""));
      advance(20);
    }
    return seen;
  }

  /** When (ms from now) the word's bursts start, watching it for `ms`. */
  function burstStarts(word: HTMLElement, ms: number) {
    const starts: number[] = [];
    let playing = word.querySelector(".glitch-layers") !== null;
    for (let t = 20; t <= ms; t += 20) {
      advance(20);
      const now = word.querySelector(".glitch-layers") !== null;
      if (now && !playing) {
        starts.push(t);
        // A burst opens on the other meaning: a twitch of the plain word would show none
        expect(word.querySelector(".glitch-cipher")).not.toBeNull();
      }
      playing = now;
    }
    return starts;
  }

  it("under the pointer, flips into shapes over the plain word, and back", () => {
    const word = closed();
    expect(word.querySelector(".glitch-layers")).toBeNull();

    hover(word);
    expect(word).toHaveAttribute("data-off");
    expect(word).toHaveAttribute("data-bursting");
    // The real word keeps its place in the line, covered while the burst plays over it
    expect(word.querySelector(".glitch-rest")).toHaveAttribute("data-covered");
    expect(word.querySelector(".glitch-rest")?.textContent).toBe("себя");
    expect(word.querySelector(".glitch-layers")).toHaveAttribute("aria-hidden", "true");

    const shapes = word.querySelector(".glitch-copy:not(.glitch-echo) .glitch-cipher");
    expect(shapes?.textContent).toMatch(SHAPES);
    expect(shapes?.textContent).toHaveLength("контекст".length);

    // Four frames in, about half a second of shapes, three frames out
    expect(watch(word, 800)).toEqual(new Set(["shapes", "себя"]));
    expect(word.querySelector(".glitch-layers")).toBeNull();
    expect(word.querySelector(".glitch-rest")).not.toHaveAttribute("data-covered");
    expect(word.textContent).toBe("себя");
  });

  it("a hover shows the shapes 73 times in 111", () => {
    // 73/111 is 0.6577: just under it shows, just over it stays plain
    const shows = closed({ rng: () => 0.65 });
    hover(shows);
    expect(shows.querySelector(".glitch-cipher")).not.toBeNull();

    const quiet = closed({ rng: () => 0.66 });
    hover(quiet);
    expect(quiet.querySelector(".glitch-layers")).toBeNull();
    expect(quiet.textContent).toBe("себя");
  });

  it("a tap gets the same chance", () => {
    const shows = closed({ rng: () => 0.65 });
    fireEvent.click(shows);
    expect(shows.querySelector(".glitch-cipher")).not.toBeNull();

    const quiet = closed({ rng: () => 0.66 });
    fireEvent.click(quiet);
    expect(quiet.querySelector(".glitch-layers")).toBeNull();
  });

  it("rolls afresh on each hover: never a settled yes or no", () => {
    // The same word: it stays plain once, shows the next time, stays plain again
    let roll = 0.9;
    const word = closed({ rng: () => roll });

    hover(word);
    expect(word.querySelector(".glitch-layers")).toBeNull();

    roll = 0.1;
    hover(word);
    expect(word.querySelector(".glitch-cipher")).not.toBeNull();
    advance(800);

    roll = 0.9;
    hover(word);
    expect(word.querySelector(".glitch-layers")).toBeNull();
  });

  it("doesn't flip on scroll-in: left alone, it waits a pause first", () => {
    const word = closed({ rng: () => 0.1 });
    setVisible(true);
    expect(word.querySelector(".glitch-layers")).toBeNull();
    // 4-10s; this rng makes it 4.6s, and lets every pause end in shapes
    expect(burstStarts(word, 4580)).toEqual([]);
    expect(burstStarts(word, 40)).toHaveLength(1);
  });

  it("left alone, a pause can end in nothing", () => {
    // This rng never lets one end in shapes
    const word = closed({ rng: () => 0.5 });
    setVisible(true);
    expect(burstStarts(word, 5 * 60_000)).toEqual([]);
    expect(word.textContent).toBe("себя");
  });

  it("left alone, shows its shapes about one pause in two", () => {
    const word = closed();
    setVisible(true);
    // 5 minutes of 4-10s pauses is some 40 of them
    const starts = burstStarts(word, 5 * 60_000);
    expect(starts[0]).toBeGreaterThanOrEqual(4000);
    expect(starts.length).toBeGreaterThanOrEqual(12);
    expect(starts.length).toBeLessThanOrEqual(30);

    setVisible(false);
    expect(burstStarts(word, 5 * 60_000)).toEqual([]);
  });

  it("never shows the other meaning as text, only keeps it in data-alt", () => {
    const word = closed();
    setVisible(true);
    for (let t = 0; t < 30_000; t += 20) {
      if (t % 3000 === 0) hover(word);
      expect(word.textContent).not.toContain("контекст");
      advance(20);
    }
    expect(word).toHaveAttribute("data-alt", "контекст");
  });

  it("gives the shapes their state's colour and the article's face", () => {
    const word = closed();
    hover(word);
    const [main] = copies(word);
    expect(main).toHaveAttribute("data-plain");
    expect(main).not.toHaveAttribute("data-link");
    expect(main.style.getPropertyValue("--glitch-color")).toBe("var(--glitch-echo)");
  });

  it("draws the base's own frames as plain article text", () => {
    const word = closed();
    hover(word);
    advance(45); // second frame of the flicker: back on the base
    const [main] = copies(word);
    expect(main.textContent).toBe("себя");
    expect(main).toHaveAttribute("data-plain");
    expect(main.style.getPropertyValue("--glitch-color")).toBe("var(--glitch-plain)");
  });

  it("holds the shapes briefly, however long the hidden text", () => {
    const word = closed({ alt: <GlitchState>a meaning long enough to be held two seconds</GlitchState> });
    hover(word);
    advance(800);
    expect(word.querySelector(".glitch-layers")).toBeNull();
  });

  it("a click stops a burst", () => {
    const word = closed();
    hover(word);
    advance(400);
    fireEvent.click(word);
    expect(word.querySelector(".glitch-layers")).toBeNull();
  });

  it("shows a > state too: closed, that is the context", () => {
    const word = closed({ alt: <GlitchState>legion</GlitchState>, openState: "1" });
    hover(word);
    expect(word.querySelector(".glitch-cipher")?.textContent).toBe("LEGION");
    expect(watch(word, 800)).toEqual(new Set(["shapes", "себя"]));
  });

  it("opening the window cuts a burst of shapes and shows the words", () => {
    const word = closed();
    hover(word);
    expect(word.querySelector(".glitch-cipher")).not.toBeNull();

    fireEvent.click(button());
    expect(word).not.toHaveAttribute("data-off");
    expect(word).not.toHaveAttribute("data-bursting");
    expect(word.querySelector(".glitch-cipher, .glitch-rest")).toBeNull();
    expect(word.querySelector(".glitch-sizer")?.textContent).toBe("себя");
    // Now a flip shows the words themselves
    hover(word);
    expect(watch(word, 1500)).toEqual(new Set(["контекст", "себя"]));
  });

  it("leaves a Window button state a button, held long enough to press", () => {
    const word = closed({
      alt: (
        <GlitchState window>
          <WindowButton off inGlitch />
        </GlitchState>
      ),
    });
    hover(word);
    advance(300);
    expect(word.querySelector(".glitch-cipher")).toBeNull();
    advance(1500);
    const flashed = word.querySelector(".glitch-copy:not(.glitch-echo) .window-toggle") as HTMLElement;
    expect(flashed).toHaveTextContent("Window OFF");

    fireEvent.click(flashed);
    expect(word).not.toHaveAttribute("data-off");
  });

  it("stays still with reduced motion", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: query.includes("reduce"), media: query }));
    const word = closed();
    setVisible(true);
    hover(word);
    advance(30_000);
    expect(word.querySelector(".glitch-layers")).toBeNull();
    expect(word.textContent).toBe("себя");
  });

  it("window-only words stay gone", () => {
    const { container } = render(
      <p>
        <WindowToggle off />
        <Glitch windowOnly windowOff rng={seeded(1)}>
          <GlitchState>only when open</GlitchState>
          <GlitchState>context</GlitchState>
        </Glitch>
      </p>,
    );
    const word = container.querySelector(".glitch") as HTMLElement;
    setVisible(true);
    hover(word);
    advance(30_000);
    expect(word.textContent).toBe("");
  });

  describe("a word that wraps", () => {
    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("gets its burst over the part on its first line", () => {
      const word = closed();
      // "се" at the end of one line, "бя" at the start of the next
      vi.spyOn(word, "getClientRects").mockReturnValue([rect(300, 100, 10, 20), rect(40, 130, 12, 20)] as unknown as DOMRectList);
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect(100, 50, 10, 30));
      hover(word);

      const layers = word.querySelector(".glitch-layers") as HTMLElement;
      expect(layers.style.width).toBe("10px");
      // Moved from where it landed (100, 50) to the first line's part, centred on its height
      expect(layers.style.left).toBe("200px");
      expect(layers.style.top).toBe("45px");
    });

    it("is left to the CSS on one line", () => {
      const word = closed();
      vi.spyOn(word, "getClientRects").mockReturnValue([rect(300, 100, 40, 20)] as unknown as DOMRectList);
      hover(word);
      expect((word.querySelector(".glitch-layers") as HTMLElement).style.width).toBe("");
    });
  });
});
