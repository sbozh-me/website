import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setReaderTheme } from "@sbozh/themes";

import { DickPitch, Glitch, GlitchState } from "../glitch";
import { seeded } from "../plan";
import { Video } from "../video";
import { Voice } from "../voice";
import { WindowToggle, setGlitchesEnabled } from "../window";

// Roman White is still everywhere except here: glitches behave as in any other theme.

class Observer {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
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

describe("glitches in Roman White", () => {
  it("draws the layers and bursts on scroll-in", () => {
    const { container } = render(
      <Glitch rng={seeded(1)}>
        <GlitchState>себя</GlitchState>
        <GlitchState>US</GlitchState>
      </Glitch>,
    );

    expect(container.querySelector(".glitch")).not.toHaveAttribute("data-off");
    expect(container.querySelector(".glitch-layers")).not.toBeNull();
    expect(container.querySelector("[data-bursting]")).not.toBeNull();
    expect(container.querySelector(".glitch-sizer")?.textContent).toBe("себя");
  });

  it("D✳CK PITCH keeps flipping", () => {
    const { container } = render(<DickPitch rng={seeded(6)} />);

    expect(container.querySelector(".brand-mark")).not.toHaveAttribute("data-off");
    expect(container.querySelector("[data-bursting]")).not.toBeNull();
  });

  it("the window button shows and closes the window", () => {
    const { container } = render(
      <>
        <WindowToggle />
        <Glitch rng={seeded(2)}>
          <GlitchState>себя</GlitchState>
          <GlitchState>US</GlitchState>
        </Glitch>
      </>,
    );
    const button = screen.getByRole("button", { name: "Window ON" });

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Window OFF" })).toBeInTheDocument();
    expect(container.querySelector(".glitch")).toHaveAttribute("data-off");
    expect(container.querySelector(".glitch")?.textContent).toBe("себя");
  });

  it("window-only words go when the window is closed", () => {
    const { container } = render(
      <Glitch windowOnly windowOff rng={seeded(4)}>
        <GlitchState>secret</GlitchState>
        <GlitchState>said</GlitchState>
      </Glitch>,
    );

    expect(container.textContent).toBe("");
  });

  it("voices take their colour", () => {
    render(
      <Voice color="purple">
        <p>Dear Audience.</p>
      </Voice>,
    );

    expect(screen.getByText("Dear Audience.").parentElement).toHaveAttribute("style");
  });

  it("videos loop on their own, without controls", () => {
    const { container } = render(<Video src="/v.mp4" title="Pan Dude" />);
    const video = container.querySelector("video")!;

    expect(video.autoplay).toBe(true);
    expect(video.controls).toBe(false);
  });
});
