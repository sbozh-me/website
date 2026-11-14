import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HomeVideoHero } from "./HomeVideoHero";

let portrait = false;
let listener: (() => void) | null = null;

beforeEach(() => {
  portrait = false;
  listener = null;
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return portrait;
    },
    media: query,
    addEventListener: (_: string, cb: () => void) => (listener = cb),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => vi.restoreAllMocks());

const video = () => document.querySelector("video")!;

describe("HomeVideoHero", () => {
  it("plays the landscape cut on landscape screens", () => {
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-desktop.mp4");
    expect(video()).toHaveAttribute("poster", "/videos/home/pan-dude-poster.jpg");
    expect(video().muted).toBe(true);
  });

  it("plays the reels cut on portrait screens", () => {
    portrait = true;
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-mobile.mp4");
  });

  it("switches cut on rotation", () => {
    render(<HomeVideoHero />);
    portrait = true;
    act(() => listener?.());
    expect(video()).toHaveAttribute("data-cut", "mobile");
  });

  it("toggles sound and keeps it across a cut switch", () => {
    render(<HomeVideoHero />);
    fireEvent.click(screen.getByRole("button", { name: "Unmute video" }));
    expect(video().muted).toBe(false);
    portrait = true;
    act(() => listener?.());
    expect(video().muted).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Mute video" }));
    expect(video().muted).toBe(true);
  });

  it("scrolls past the hero", () => {
    render(<HomeVideoHero />);
    fireEvent.click(screen.getByRole("button", { name: "Scroll to content" }));
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });
});
