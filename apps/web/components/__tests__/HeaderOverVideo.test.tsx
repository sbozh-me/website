import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { Header } from "../Header";

describe("Header over the home video", () => {
  it("floats translucent over the video on the home page", () => {
    pathname.current = "/";
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-over-video", "true");
    expect(header.className).toContain("absolute");
    expect(header.className).toContain("bg-background/40");
  });

  it("stays solid and in the flow on other pages", () => {
    pathname.current = "/blog";
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveAttribute("data-over-video");
    expect(header.className).toContain("relative");
    expect(header.className).not.toContain("bg-background/40");
  });
});
