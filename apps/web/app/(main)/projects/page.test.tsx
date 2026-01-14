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
    expect(screen.getByText("Private Discord Community")).toBeInTheDocument();
  });

  it("renders status badges", () => {
    render(<ProjectsPage />);
    // sbozh.me has "beta" status, Discord Community has "active" status
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
