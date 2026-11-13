import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOUBLE_TAP_MS, VideoFrame } from "../video-frame";

let fullscreenElement: Element | null = null;
const requestFullscreen = vi.fn(function (this: Element) {
  fullscreenElement = this;
  document.dispatchEvent(new Event("fullscreenchange"));
  return Promise.resolve();
});
const exitFullscreen = vi.fn(() => {
  fullscreenElement = null;
  document.dispatchEvent(new Event("fullscreenchange"));
  return Promise.resolve();
});

beforeEach(() => {
  fullscreenElement = null;
  Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreenElement });
  Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", { configurable: true, value: requestFullscreen });
});

afterEach(() => {
  vi.clearAllMocks();
  delete (HTMLElement.prototype as Partial<HTMLElement>).requestFullscreen;
});

function frame() {
  const { container } = render(
    <VideoFrame className="window-video" data-window="on">
      <video src="/a.mp4" />
    </VideoFrame>,
  );
  return container.querySelector(".window-video") as HTMLElement;
}

const tap = (element: Element, timeStamp: number, x = 10, y = 10) => {
  const event = new MouseEvent("pointerup", { bubbles: true, clientX: x, clientY: y });
  Object.defineProperties(event, { pointerType: { value: "touch" }, timeStamp: { value: timeStamp } });
  act(() => {
    element.dispatchEvent(event);
  });
};

describe("VideoFrame", () => {
  it("pauses on a click on the video, shows the play mark, and resumes on the next", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const element = frame();
    const video = element.querySelector("video")!;
    Object.defineProperty(video, "paused", { configurable: true, value: false });

    fireEvent.click(video);
    expect(pause).toHaveBeenCalledOnce();
    expect(element).toHaveAttribute("data-paused");
    expect(element.querySelector(".video-paused-mark")).toBeInTheDocument();

    Object.defineProperty(video, "paused", { configurable: true, value: true });
    fireEvent.click(video);
    expect(play).toHaveBeenCalledOnce();
    expect(element).not.toHaveAttribute("data-paused");
    expect(element.querySelector(".video-paused-mark")).toBeNull();

    // Clicks on the controls don't count
    fireEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(pause).toHaveBeenCalledOnce();
    play.mockRestore();
    pause.mockRestore();
  });

  it("sets the volume of every video from the slider, muting at zero", () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const { container } = render(
      <VideoFrame className="window-video">
        <video src="/hidden.mp4" muted hidden />
        <video src="/shown.mp4" muted />
      </VideoFrame>,
    );
    const videos = Array.from(container.querySelectorAll("video"));
    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(slider).toHaveAttribute("aria-orientation", "vertical");

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    // Radix steps the vertical slider with the arrow keys
    fireEvent.keyDown(slider, { key: "PageDown" });
    for (const video of videos) {
      expect(video.muted).toBe(false);
      expect(video.volume).toBeCloseTo(0.9);
    }
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    for (const video of videos) expect(video.muted).toBe(true);
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();

    // Unmuting after sliding to zero comes back at the last level
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    for (const video of videos) expect(video.volume).toBeCloseTo(0.9);
    expect(slider).toHaveAttribute("aria-valuenow", "90");
  });


  it("starts muted and unmutes every video in the frame, playing the visible one", () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const { container } = render(
      <VideoFrame className="window-video">
        <video src="/hidden.mp4" muted hidden />
        <video src="/shown.mp4" muted />
      </VideoFrame>,
    );
    const [hidden, shown] = Array.from(container.querySelectorAll("video"));
    expect(hidden.muted && shown.muted).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(hidden.muted || shown.muted).toBe(false);
    expect(play).toHaveBeenCalledOnce();
    expect(play.mock.contexts[0]).toBe(shown);
    expect(screen.getByRole("button", { name: "Mute" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));
    expect(hidden.muted && shown.muted).toBe(true);
    expect(play).toHaveBeenCalledOnce();
    play.mockRestore();
  });


  it("passes data attributes through and toggles fullscreen with the button", async () => {
    const element = frame();
    expect(element).toHaveAttribute("data-window", "on");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Fullscreen" })));
    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(element).toHaveAttribute("data-fullscreen");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Exit fullscreen" })));
    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(element).not.toHaveAttribute("data-fullscreen");
  });

  it("goes fullscreen on a double click, but not on the button's own double click", async () => {
    const element = frame();
    await act(async () => fireEvent.doubleClick(element.querySelector("video")!));
    expect(requestFullscreen).toHaveBeenCalledOnce();
    await act(async () => fireEvent.doubleClick(screen.getByRole("button", { name: "Exit fullscreen" })));
    expect(exitFullscreen).not.toHaveBeenCalled();
  });

  it("goes fullscreen on a quick double tap, not on slow or far-apart taps", () => {
    const video = frame().querySelector("video")!;
    // React reads a 0 timeStamp as "now", so start later
    const start = 1000;
    tap(video, start);
    tap(video, start + DOUBLE_TAP_MS + 50);
    expect(requestFullscreen).not.toHaveBeenCalled();
    tap(video, start + DOUBLE_TAP_MS + 100, 200, 200);
    expect(requestFullscreen).not.toHaveBeenCalled();
    tap(video, start + DOUBLE_TAP_MS + 200, 200, 200);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("ignores mouse pointer-ups (those use dblclick)", () => {
    const video = frame().querySelector("video")!;
    for (const timeStamp of [1000, 1050]) {
      const event = new MouseEvent("pointerup", { bubbles: true });
      Object.defineProperties(event, { pointerType: { value: "mouse" }, timeStamp: { value: timeStamp } });
      video.dispatchEvent(event);
    }
    expect(requestFullscreen).not.toHaveBeenCalled();
  });

  it("falls back to the visible video's native fullscreen where elements can't go fullscreen (iPhone)", () => {
    delete (HTMLElement.prototype as Partial<HTMLElement>).requestFullscreen;
    const { container } = render(
      <VideoFrame className="window-video">
        <video src="/hidden.mp4" hidden />
        <video src="/shown.mp4" />
      </VideoFrame>,
    );
    const [hidden, shown] = Array.from(container.querySelectorAll("video"));
    const enterHidden = vi.fn();
    const enterShown = vi.fn();
    Object.assign(hidden, { webkitEnterFullscreen: enterHidden });
    Object.assign(shown, { webkitEnterFullscreen: enterShown });
    fireEvent.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(enterShown).toHaveBeenCalledOnce();
    expect(enterHidden).not.toHaveBeenCalled();
  });
});
