import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BlogPage from "./page";

describe("BlogPage", () => {
  it("renders blog heading", async () => {
    render(await BlogPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Blog");
  });

  it("renders timeline with posts", async () => {
    render(await BlogPage());
    // Should show year markers from mock data
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders post titles from mock data", async () => {
    render(await BlogPage());
    expect(screen.getByText("Why I started sbozh.me")).toBeInTheDocument();
    expect(screen.getByText("On patience and shipping")).toBeInTheDocument();
  });
});
