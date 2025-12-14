import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("renders projects heading", () => {
    render(<ProjectsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Projects",
    );
  });

  it("renders project cards", () => {
    render(<ProjectsPage />);
    expect(screen.getByText("sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("Discord Community")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    render(<ProjectsPage />);
    // Both projects in data.ts have "beta" status
    // StatusBadge component renders "Beta" (capitalized)
    const betaBadges = screen.getAllByText("Beta");
    expect(betaBadges).toHaveLength(2);

    // Verify no "Coming Soon" badges exist since no projects have that status
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument();
  });
});
