import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WindowToggle, setGlitchesEnabled } from "../window";
import { WindowVideo } from "../window-video";

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom doesn't implement media playback
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  act(() => setGlitchesEnabled(null));
});

afterEach(() => {
  vi.restoreAllMocks();
});

const videos = (container: HTMLElement) => {
  const [on, off] = Array.from(container.querySelectorAll("video"));
  return { on, off };
};

function page(windowOff = false) {
  return render(
    <>
      <WindowToggle off={windowOff} />
      <WindowVideo on="/on.mp4" off="/off.mp4" onPoster="/on.jpg" offPoster="/off.jpg" title="Pan Dude" windowOff={windowOff} />
    </>,
  );
}

describe("WindowVideo", () => {
  it("shows the ON video with the window open and keeps the OFF one hidden", () => {
    const { container } = page();
    const { on, off } = videos(container);
    expect(on).toHaveAttribute("src", "/on.mp4");
    expect(on).toHaveAttribute("poster", "/on.jpg");
    expect(on.hidden).toBe(false);
    expect(off).toHaveAttribute("src", "/off.mp4");
    expect(off.hidden).toBe(true);
    for (const video of [on, off]) {
      expect(video.muted).toBe(true);
      expect(video.loop).toBe(true);
      expect(video).toHaveAttribute("playsinline");
      expect(video).toHaveAttribute("aria-label", "Pan Dude");
    }
    expect(container.querySelector(".window-video")).toHaveAttribute("data-window", "on");
  });

  it("switches to the OFF video at the same timestamp when the window closes, and back", () => {
    const { container } = page();
    const { on, off } = videos(container);
    on.currentTime = 12.5;
    play.mockClear();
    pause.mockClear();

    fireEvent.click(screen.getByRole("button"));
    expect(on.hidden).toBe(true);
    expect(off.hidden).toBe(false);
    expect(off.currentTime).toBe(12.5);
    expect(pause.mock.contexts).toContain(on);
    expect(play.mock.contexts).toContain(off);

    off.currentTime = 20;
    fireEvent.click(screen.getByRole("button"));
    expect(on.hidden).toBe(false);
    expect(on.currentTime).toBe(20);
    expect(play.mock.contexts).toContain(on);
  });

  it("follows the W hotkey", () => {
    const { container } = page();
    act(() => void window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", key: "w" })));
    expect(videos(container).off.hidden).toBe(false);
  });

  it("renders the OFF video on the server for a ==WINDOW OFF== page", () => {
    const html = renderToStaticMarkup(
      <>
        <WindowToggle off />
        <WindowVideo on="/on.mp4" off="/off.mp4" windowOff />
      </>,
    );
    const div = document.createElement("div");
    div.innerHTML = html;
    const { on, off } = videos(div);
    expect(on.hidden).toBe(true);
    expect(off.hidden).toBe(false);
    expect(off).toHaveAttribute("autoplay");
    expect(on).not.toHaveAttribute("autoplay");
  });

  it("starts OFF on a ==WINDOW OFF== page and opens with the button", () => {
    const { container } = page(true);
    expect(videos(container).off.hidden).toBe(false);
    fireEvent.click(screen.getByRole("button"));
    expect(videos(container).on.hidden).toBe(false);
  });

  it("survives a refused autoplay", () => {
    play.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));
    const { container } = page();
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    expect(videos(container).off.hidden).toBe(false);
  });
});
