import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseTimeline } from "@sbozh/release-notes/components";
import type { ReleaseListItem } from "@sbozh/release-notes/types";

const release: ReleaseListItem = {
  id: "1",
  slug: "glitch-goblin-and-a-hero-that-pauses",
  version: "1.15.5",
  title: "Glitch Goblin and a hero that pauses",
  summary: "## Changes\n\n- **A new glitch typeface** - the whole note, read on its own page",
  dateReleased: "2026-11-28T12:00:00",
  project: { id: "p", name: "sbozh.me", slug: "sbozh-me" },
  type: "feature",
  media: { type: "image", url: "/media/shot.png", alt: "A screenshot" },
};

describe("ReleaseTimeline cards", () => {
  it("shows the title, type, date and version, and the whole card opens the release", () => {
    render(<ReleaseTimeline releases={[release]} />);
    const card = screen.getByRole("link", { name: /Glitch Goblin and a hero that pauses/ });
    expect(card).toHaveAttribute("href", "/projects/sbozh-me/releases/glitch-goblin-and-a-hero-that-pauses");
    expect(within(card).getByRole("heading", { name: "Glitch Goblin and a hero that pauses" })).toBeInTheDocument();
    expect(card).toHaveTextContent("Feature");
    expect(within(card).getByText("Nov 28, 2026")).toHaveAttribute("datetime", "2026-11-28T12:00:00");
    expect(card).toHaveTextContent("1.15.5");
  });

  it("leaves the summary and the media to the release's page", () => {
    render(<ReleaseTimeline releases={[release]} />);
    expect(screen.queryByText(/A new glitch typeface/)).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByAltText("A screenshot")).toBeNull();
  });

  it("marks the newest release Latest when it is the running version", () => {
    const older = { ...release, id: "2", slug: "older", title: "Older", version: "1.15.4" };
    const { rerender } = render(<ReleaseTimeline releases={[release, older]} currentVersion="1.15.5" />);
    expect(screen.getAllByText("Latest")).toHaveLength(1);
    expect(within(screen.getByRole("link", { name: /Glitch Goblin/ })).getByText("Latest")).toBeInTheDocument();
    rerender(<ReleaseTimeline releases={[release, older]} currentVersion="1.15.6" />);
    expect(screen.queryByText("Latest")).toBeNull();
  });

  it("lists each release once", () => {
    const older = { ...release, id: "2", slug: "older", title: "Older", version: "1.15.4" };
    render(<ReleaseTimeline releases={[release, older]} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
