import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeriesStatusBadge } from "../../components/series/SeriesStatusBadge";

describe("SeriesStatusBadge", () => {
  it.each([
    ["planned", "Planned", "text-secondary"],
    ["ongoing", "Ongoing", "text-accent"],
    ["finished", "Finished", "text-primary"],
  ] as const)("labels %s as %s", (status, label, color) => {
    render(<SeriesStatusBadge status={status} />);

    const badge = screen.getByText(label);
    expect(badge).toHaveAttribute("data-status", status);
    expect(badge).toHaveClass(color);
  });

  it.each(["planned", "ongoing", "finished"] as const)(
    "sits on obsidian whatever the theme (%s)",
    (status) => {
      const { container } = render(<SeriesStatusBadge status={status} />);
      const badge = container.querySelector(`[data-status="${status}"]`);

      expect(badge?.closest('[data-theme-island="obsidian-forge"]')).not.toBeNull();
      expect(badge).toHaveClass("bg-background");
    }
  );

  it("pulses only while ongoing", () => {
    const { container, rerender } = render(<SeriesStatusBadge status="ongoing" />);
    expect(container.querySelector(".animate-pulse")).not.toBeNull();

    rerender(<SeriesStatusBadge status="finished" />);
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("takes extra classes", () => {
    render(<SeriesStatusBadge status="planned" className="mt-8" />);

    expect(screen.getByText("Planned")).toHaveClass("mt-8", "border-dashed");
  });
});
