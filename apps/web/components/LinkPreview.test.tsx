import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLinkPreviewMetaCache, LinkPreview } from "./LinkPreview";

function pointerEvent(type: "pointerover" | "pointerout", target: Element, pointerType = "mouse") {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  Object.defineProperty(event, "relatedTarget", { value: null });
  target.dispatchEvent(event);
}

function stubHoverDevice(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches, addEventListener() {}, removeEventListener() {} }),
  );
}

function stubFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Puts the link in a blog post body by default, or in an unmarked container (a blog list,
// a project page's prose)
function addLink(href: string, inPostBody = true) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = "Link";
  const container = document.createElement("div");
  container.className = "prose";
  if (inPostBody) container.setAttribute("data-link-preview", "");
  container.appendChild(link);
  document.body.appendChild(container);
  return link;
}

function visible(container: HTMLElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`)?.getAttribute("data-visible") === "true";
}

// Lets the card fade out and unmount
async function waitForFade() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });
}

// Runs the show delay and lets the fetched preview resolve
async function hoverAndWait(link: Element, pointerType = "mouse") {
  act(() => pointerEvent("pointerover", link, pointerType));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
}

describe("LinkPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubHoverDevice(true);
    clearLinkPreviewMetaCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("shows the OG image of a hovered internal link after a short delay", async () => {
    const fetchMock = stubFetch({ image: "/api/og/blog/hello-world", title: "Hello" });
    const link = addLink("/blog/hello-world");
    const { container } = render(<LinkPreview />);

    act(() => pointerEvent("pointerover", link));
    expect(container.querySelector("img")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/link-preview?path=%2Fblog%2Fhello-world");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/api/og/blog/hello-world");
  });

  it("previews any internal page, such as a series", async () => {
    stubFetch({ image: "/series.png", title: "Series" });
    const link = addLink("/blog/series/my-series");
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/series.png");
  });

  it("shows the SparkMark placeholder and title for pages without their own OG image", async () => {
    stubFetch({ image: null, title: "Privacy" });
    const link = addLink("/privacy");
    const { container, getByTestId } = render(<LinkPreview />);

    await hoverAndWait(link);
    expect(container.querySelector("img")).toBeNull();
    expect(visible(container, "link-preview-placeholder")).toBe(true);
    expect(visible(container, "link-preview-loading")).toBe(false);
    expect(getByTestId("link-preview-placeholder").textContent).toContain("Privacy");
  });

  it("falls back to the placeholder when the OG image fails to load", async () => {
    stubFetch({ image: "/missing.png", title: "Broken" });
    const link = addLink("/blog/broken");
    const { container, getByTestId } = render(<LinkPreview />);

    await hoverAndWait(link);
    act(() => {
      fireEvent.error(container.querySelector("img")!);
    });
    expect(container.querySelector("img")).toBeNull();
    expect(visible(container, "link-preview-placeholder")).toBe(true);
    expect(getByTestId("link-preview-placeholder").textContent).toContain("Broken");
  });

  it("shows a spinning SparkMark after 300ms, then crossfades to the loaded image", async () => {
    let resolveFetch!: (value: unknown) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(new Promise((resolve) => (resolveFetch = resolve))),
    );
    const link = addLink("/blog/ok");
    const { container } = render(<LinkPreview />);

    act(() => pointerEvent("pointerover", link));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(container.firstElementChild).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(visible(container, "link-preview-loading")).toBe(true);
    const spark = container.querySelector('[data-testid="link-preview-loading"] svg')!;
    expect(spark.getAttribute("class")).toContain("animate-spin");
    // Drawn around the SVG's center so it spins in place
    expect(spark.getAttribute("viewBox")).toBe("-12 -12 24 24");

    await act(async () => {
      resolveFetch({ ok: true, json: () => Promise.resolve({ image: "/ok.png", title: null }) });
    });
    const img = container.querySelector("img")!;
    expect(img.className).toContain("opacity-0");
    expect(visible(container, "link-preview-loading")).toBe(true);

    act(() => {
      fireEvent.load(img);
    });
    expect(img.className).toContain("opacity-100");
    expect(visible(container, "link-preview-loading")).toBe(false);
    expect(visible(container, "link-preview-placeholder")).toBe(false);
  });

  it("fades the card in and out", async () => {
    stubFetch({ image: null, title: "Fade" });
    const link = addLink("/fade");
    const { container, getByTestId } = render(<LinkPreview />);

    await hoverAndWait(link);
    const card = getByTestId("link-preview");
    expect(card.className).toContain("fade-in-0");
    expect(card.getAttribute("data-open")).toBe("true");

    act(() => pointerEvent("pointerout", link));
    expect(card.getAttribute("data-open")).toBe("false");
    expect(card.className).toContain("opacity-0");
    expect(container.firstElementChild).not.toBeNull();

    await waitForFade();
    expect(container.firstElementChild).toBeNull();
  });

  it("shows nothing when the page has no preview", async () => {
    stubFetch({ error: "No preview" }, false);
    const link = addLink("/missing");
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link);
    await waitForFade();
    expect(container.firstElementChild).toBeNull();
  });

  it("fetches each page once", async () => {
    const fetchMock = stubFetch({ image: null, title: "Once" });
    const link = addLink("/once");
    render(<LinkPreview />);

    await hoverAndWait(link);
    act(() => pointerEvent("pointerout", link));
    await hoverAndWait(link);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not show a preview for touch input", async () => {
    const fetchMock = stubFetch({ image: null, title: "x" });
    const link = addLink("/blog/hello-world");
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link, "touch");
    expect(container.firstElementChild).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("previews external links through the url query", async () => {
    const fetchMock = stubFetch({ image: "/api/link-preview/image?url=x", title: "Example" });
    const link = addLink("https://example.com/blog/hello-world#part");
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/link-preview?url=https%3A%2F%2Fexample.com%2Fblog%2Fhello-world",
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/api/link-preview/image?url=x");
  });

  it("does not show a preview for non-web links", async () => {
    const fetchMock = stubFetch({ image: null, title: "x" });
    const link = addLink("mailto:hi@sbozh.me");
    render(<LinkPreview />);

    await hoverAndWait(link);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not show a preview for links outside a blog post body", async () => {
    const fetchMock = stubFetch({ image: null, title: "x" });
    const link = addLink("/blog/hello-world", false);
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.firstElementChild).toBeNull();
  });

  it("hides the preview when the pointer leaves the link, and on Escape", async () => {
    stubFetch({ image: null, title: "Bye" });
    const link = addLink("/bye");
    const { container } = render(<LinkPreview />);

    await hoverAndWait(link);
    expect(container.firstElementChild).not.toBeNull();
    act(() => pointerEvent("pointerout", link));
    await waitForFade();
    expect(container.firstElementChild).toBeNull();

    await hoverAndWait(link);
    expect(container.firstElementChild).not.toBeNull();
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await waitForFade();
    expect(container.firstElementChild).toBeNull();
  });

  it("cancels a pending preview when the pointer leaves before the delay", async () => {
    stubFetch({ image: null, title: "Gone" });
    const link = addLink("/gone");
    const { container } = render(<LinkPreview />);

    act(() => pointerEvent("pointerover", link));
    act(() => pointerEvent("pointerout", link));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(container.firstElementChild).toBeNull();
  });

  it("does nothing on devices without fine hover input", async () => {
    stubHoverDevice(false);
    const fetchMock = stubFetch({ image: null, title: "x" });
    const link = addLink("/blog/hello-world");
    render(<LinkPreview />);

    await hoverAndWait(link);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
