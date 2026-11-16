import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsPage from "./page";

describe("ProjectsPage", () => {
  it("renders projects heading", async () => {
    render(await ProjectsPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Projects",
    );
  });

  it("renders project cards", async () => {
    render(await ProjectsPage());
    expect(screen.getByText("sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("tecraft.cz")).toBeInTheDocument();
  });

  it("renders status badges", async () => {
    render(await ProjectsPage());
    // Both sbozh.me and tecraft.cz have "beta" status
    expect(screen.getAllByText("Beta")).toHaveLength(2);
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });
});
