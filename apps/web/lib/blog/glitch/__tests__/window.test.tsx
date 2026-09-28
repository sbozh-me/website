import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DickPitch, Glitch, GlitchState } from "../glitch";
import { seeded } from "../plan";
import { WindowToggle, setGlitchesEnabled } from "../window";

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

  it("OFF turns every glitch word into plain text", () => {
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

  it("OFF stops bursts, including one in progress", () => {
    const { container } = page();
    setVisible(true);
    expect(container.querySelector("[data-bursting]")).not.toBeNull();

    fireEvent.click(button());
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(glitch(container).textContent).toBe("себя");

    fireEvent.pointerEnter(glitch(container));
    advance(60_000);
    expect(container.querySelector("[data-bursting]")).toBeNull();
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
    const brand = container.querySelector(".dick-pitch") as HTMLElement;
    expect(brand).toHaveAttribute("data-off");
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
        <Glitch windowOff rng={seeded(1)}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
      </p>,
    );
    expect(button()).toHaveTextContent("Window OFF");
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(glitch(container)).toHaveAttribute("data-off");
    setVisible(true);
    expect(container.querySelector("[data-bursting]")).toBeNull();

    fireEvent.click(button());
    expect(button()).toHaveTextContent("Window ON");
    expect(glitch(container).querySelector(".glitch-layers")).not.toBeNull();
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

  it("an unclosable glitch ignores the window", () => {
    const { container } = render(
      <p>
        <WindowToggle off />
        <Glitch windowOff unclosable rng={seeded(1)}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
        <Glitch windowOff>
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
    expect(normal).not.toHaveAttribute("data-bursting");
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
