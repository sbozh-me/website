import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReaderTheme } from "@sbozh/themes";

import { DickPitch, Glitch, GlitchState, STILL_STATE, stillIndex } from "../glitch";
import { seeded } from "../plan";
import { Video } from "../video";
import { Voice } from "../voice";
import { WindowButton, WindowToggle, setGlitchesEnabled } from "../window";

// Roman White: every glitch word is plain text in its final state, and nothing moves.

class Observer {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    // Fully in view at once: a moving word would burst straight away
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as never);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

const originalObserver = window.IntersectionObserver;

beforeEach(() => {
  vi.useFakeTimers();
  window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query }));
  setReaderTheme("roman-white");
});

afterEach(() => {
  act(() => {
    setReaderTheme(null);
    setGlitchesEnabled(null);
  });
  vi.useRealTimers();
  window.IntersectionObserver = originalObserver;
});

describe("glitch words in Roman White", () => {
  it("defaults to the final state", () => {
    expect(STILL_STATE).toBe("final");
  });

  it("render as plain text in their final state and never burst", () => {
    const { container } = render(
      <p>
        Для{" "}
        <Glitch rng={seeded(1)}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
        .
      </p>,
    );

    expect(container.textContent).toBe("Для US.");
    expect(container.querySelector(".glitch")).toHaveAttribute("data-off");
    expect(container.querySelector(".glitch-layers")).toBeNull();

    act(() => void vi.advanceTimersByTime(20_000));
    expect(container.querySelector("[data-bursting]")).toBeNull();
    expect(container.textContent).toBe("Для US.");
  });

  it("keeps unclosable words still too", () => {
    const { container } = render(
      <Glitch unclosable rng={seeded(3)}>
        <GlitchState>право</GlitchState>
        <GlitchState>imperium</GlitchState>
      </Glitch>,
    );
    act(() => void vi.advanceTimersByTime(20_000));

    expect(container.textContent).toBe("imperium");
    expect(container.querySelector(".glitch-layers")).toBeNull();
  });

  it("shows window-only words instead of hiding them", () => {
    const { container } = render(
      <Glitch windowOnly windowOff rng={seeded(4)}>
        <GlitchState>secret</GlitchState>
        <GlitchState>said</GlitchState>
      </Glitch>,
    );

    expect(container.textContent).toBe("said");
  });

  it("skips a Window-button state when picking the final one", () => {
    const { container } = render(
      <Glitch rng={seeded(5)}>
        <GlitchState>заметили</GlitchState>
        <GlitchState>Window</GlitchState>
        <GlitchState window>
          <WindowButton inGlitch />
        </GlitchState>
      </Glitch>,
    );

    expect(container.textContent).toBe("Window");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("stillIndex falls back to the base when every alt is a Window button", () => {
    const states = [
      <GlitchState key="a">a</GlitchState>,
      <GlitchState key="w" window>
        w
      </GlitchState>,
    ];
    expect(stillIndex(states)).toBe(0);
  });

  it("go back to glitching when the reader switches to dark", () => {
    const { container } = render(
      <Glitch rng={seeded(1)}>
        <GlitchState>себя</GlitchState>
        <GlitchState>US</GlitchState>
      </Glitch>,
    );
    act(() => setReaderTheme(null));

    expect(container.querySelector(".glitch")).not.toHaveAttribute("data-off");
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("себя");
  });

  it("D✳CK PITCH stays a static brand mark", () => {
    const { container } = render(<DickPitch rng={seeded(6)} />);
    act(() => void vi.advanceTimersByTime(20_000));

    expect(container.querySelector(".brand-mark")).toHaveAttribute("data-off");
    expect(container.querySelector(".glitch-layers")).toBeNull();
  });
});

describe("the window in Roman White", () => {
  it("hides the Window toggle: there is nothing to open", () => {
    render(<WindowToggle />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("leaves voices in the article colour", () => {
    render(
      <Voice color="purple">
        <p>Dear Audience.</p>
      </Voice>,
    );
    expect(screen.getByText("Dear Audience.").parentElement).not.toHaveAttribute("style");
  });

  it("videos wait for the reader: no autoplay, with controls", () => {
    const { container } = render(<Video src="/v.mp4" title="Pan Dude" />);
    const video = container.querySelector("video")!;

    expect(video.autoplay).toBe(false);
    expect(video.controls).toBe(true);
  });
});
