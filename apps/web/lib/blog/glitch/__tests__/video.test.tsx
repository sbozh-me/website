import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Video } from "../video";

describe("Video", () => {
  it("renders a silent looping inline video with its poster and name", () => {
    const div = document.createElement("div");
    div.innerHTML = renderToStaticMarkup(<Video src="/a.mp4" poster="/a.jpg" title="Pan Dude" />);
    const video = div.querySelector(".window-video video") as HTMLVideoElement;
    expect(video).toHaveAttribute("src", "/a.mp4");
    expect(video).toHaveAttribute("poster", "/a.jpg");
    expect(video).toHaveAttribute("aria-label", "Pan Dude");
    for (const attribute of ["autoplay", "loop", "playsinline"]) expect(video).toHaveAttribute(attribute);
    // Browsers only autoplay before hydration if the server HTML says muted
    expect(video).toHaveAttribute("muted");
    const buttons = Array.from(div.querySelectorAll(".window-video button"), (b) => b.getAttribute("aria-label"));
    expect(buttons).toEqual(["Unmute", "Fullscreen"]);
  });

  it("works without a poster or title", () => {
    const div = document.createElement("div");
    div.innerHTML = renderToStaticMarkup(<Video src="/a.mp4" />);
    const video = div.querySelector("video") as HTMLVideoElement;
    expect(video).not.toHaveAttribute("poster");
    expect(video).not.toHaveAttribute("aria-label");
  });
});
