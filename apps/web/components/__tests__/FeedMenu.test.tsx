import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedMenu } from "../FeedMenu";

// Radix opens menus on pointerdown, which jsdom's click doesn't send
function openMenu() {
  fireEvent.pointerDown(screen.getByRole("button", { name: "Feeds" }), { button: 0, ctrlKey: false });
}

describe("FeedMenu", () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers both feed URLs", () => {
    render(<FeedMenu />);
    openMenu();

    expect(screen.getByRole("menuitem", { name: "Copy RSS URL" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Copy Atom URL" })).toBeInTheDocument();
  });

  it("copies the absolute URL, says Copied! and then closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<FeedMenu />);
    openMenu();

    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: "Copy Atom URL" }));
    });

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/atom.xml`);
    expect(screen.getByRole("menuitem", { name: "Copied!" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the feed when the clipboard is unavailable", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<FeedMenu />);
    openMenu();

    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: "Copy RSS URL" }));
    });

    expect(open).toHaveBeenCalledWith(`${window.location.origin}/rss.xml`, "_blank", "noopener");
  });

  it("includes both topics by default and narrows the URL with ?topics=", async () => {
    render(<FeedMenu />);
    openMenu();

    const blog = screen.getByRole("menuitemcheckbox", { name: "Blog posts" });
    const releases = screen.getByRole("menuitemcheckbox", { name: "Release notes" });
    expect(blog).toHaveAttribute("aria-checked", "true");
    expect(releases).toHaveAttribute("aria-checked", "true");

    fireEvent.click(releases);
    expect(releases).toHaveAttribute("aria-checked", "false");
    // The last ticked topic can't be unticked
    expect(screen.getByRole("menuitemcheckbox", { name: "Blog posts" })).toHaveAttribute("data-disabled");

    await act(async () => {
      fireEvent.click(screen.getByRole("menuitem", { name: "Copy RSS URL" }));
    });
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/rss.xml?topics=blog`);
  });
});
