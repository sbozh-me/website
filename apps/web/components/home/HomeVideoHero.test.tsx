import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { loadKagurameScript, type KagurameScript } from "@/lib/kagurame/script";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { HomeVideoHero } from "./HomeVideoHero";

let portrait = false;
let script: KagurameScript;

// Kagurame's real script, prepared as the home page does
beforeAll(async () => {
  script = (await loadKagurameScript())!;
});
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
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
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

  it("waits for the video to end before Kagurame talks", () => {
    render(<HomeVideoHero script={script} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /Talk to Kagurame/ })).toBeInTheDocument();
    expect(video().loop).toBe(false);
  });

  it("pauses at the end of the first run and opens the dialogue, then loops", async () => {
    render(<HomeVideoHero script={script} />);
    fireEvent.play(video());
    expect(screen.getByRole("button", { name: "Pause video" })).toBeInTheDocument();
    // A video that runs out fires pause, then ended
    fireEvent.pause(video());
    fireEvent.ended(video());
    // The Talk button fades out first (AnimatePresence "wait")
    expect(await screen.findByRole("dialog", { name: "Kagurame" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
    expect(video().loop).toBe(true);
    // Ended: the video steps aside for the poster, and comes back when played again
    expect(video()).toHaveAttribute("data-ended");
    expect(video()).toHaveClass("opacity-0");
    fireEvent.play(video());
    expect(video()).not.toHaveAttribute("data-ended");
    expect(video()).toHaveClass("opacity-100");
  });

  it("keeps the video controls when Kagurame's script is broken", () => {
    render(<HomeVideoHero script={null} />);
    fireEvent.ended(video());
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: /Talk to Kagurame/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Play video" })).toBeInTheDocument();
  });

  it("toggles with the Play/Pause button", () => {
    render(<HomeVideoHero />);
    fireEvent.play(video());
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    fireEvent.pause(video());
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("toggles with a click on the video", () => {
    render(<HomeVideoHero />);
    fireEvent.play(video());
    fireEvent.click(video());
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    fireEvent.pause(video());
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();
    fireEvent.click(video());
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it("doesn't restart a paused video on rotation", () => {
    render(<HomeVideoHero />);
    fireEvent.play(video());
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    fireEvent.pause(video());
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();
    portrait = true;
    act(() => listener?.());
    expect(video()).toHaveAttribute("data-cut", "mobile");
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("keeps the sound button next to Play/Pause", () => {
    render(<HomeVideoHero />);
    const sound = screen.getByRole("button", { name: "Unmute video" });
    const play = screen.getByRole("button", { name: /(Play|Pause) video/ });
    expect(sound.parentElement).toBe(play.parentElement);
  });
});

describe("HomeVideoHero quality", () => {
  // A retina laptop: twice the desktop SD file's pixels and more
  function retina() {
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
  }
  function connection(value: object | undefined) {
    Object.defineProperty(navigator, "connection", { value, configurable: true });
  }

  afterEach(() => {
    Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
    connection(undefined);
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
    vi.unstubAllGlobals();
  });

  it("keeps SD where the screen wouldn't show the difference", () => {
    connection({ effectiveType: "4g", downlink: 10 });
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-desktop.mp4");
    expect(video()).toHaveAttribute("data-quality", "sd");
  });

  it("plays HD on a big screen with a fast connection", () => {
    retina();
    connection({ effectiveType: "4g", downlink: 10 });
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-desktop-hd.mp4");
    expect(video()).toHaveAttribute("data-quality", "hd");
  });

  it("respects Save-Data and slow connections", () => {
    retina();
    connection({ effectiveType: "4g", downlink: 10, saveData: true });
    const { unmount } = render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("data-quality", "sd");
    unmount();
    window.sessionStorage.clear();
    connection({ effectiveType: "3g", downlink: 1.5 });
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-desktop.mp4");
  });

  it("takes ?video=sd|hd as given", () => {
    retina();
    connection({ effectiveType: "4g", downlink: 10 });
    window.history.replaceState(null, "", "/?video=sd");
    render(<HomeVideoHero />);
    expect(video()).toHaveAttribute("data-quality", "sd");
  });

  it("probes the HD file when the browser gives no hints, then plays HD", async () => {
    retina();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(512 * 1024));
        controller.close();
      },
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 206 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<HomeVideoHero />);
    // Nothing loads until it's decided
    expect(video()).not.toHaveAttribute("src");
    await waitFor(() => expect(video()).toHaveAttribute("src", "/videos/home/pan-dude-desktop-hd.mp4"));
    expect(fetchMock).toHaveBeenCalledWith("/videos/home/pan-dude-desktop-hd.mp4", expect.anything());
    expect(window.sessionStorage.getItem("sbozh:video-quality")).toBe("hd");
  });
});
