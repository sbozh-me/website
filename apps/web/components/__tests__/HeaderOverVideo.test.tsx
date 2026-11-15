import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { Header } from "../Header";

describe("Header over the home video", () => {
  it("is fixed and translucent over the video on the home page", () => {
    pathname.current = "/";
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-over-video", "true");
    expect(header).toHaveAttribute("data-theme-island", "obsidian-forge");
    expect(header.className).toContain("fixed");
    expect(header.className).toContain("bg-background/40");
  });

  it("drops the dark island once the hero has scrolled behind it", () => {
    pathname.current = "/";
    const hero = document.createElement("section");
    hero.setAttribute("data-home-hero", "");
    let bottom = 800;
    hero.getBoundingClientRect = () => ({ bottom }) as DOMRect;
    document.body.appendChild(hero);

    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).toHaveAttribute("data-over-video", "true");

    bottom = -10;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(header).not.toHaveAttribute("data-over-video");
    expect(header).not.toHaveAttribute("data-theme-island");
    expect(header.className).toContain("fixed");
    expect(header.className).toContain("backdrop-blur-lg");

    hero.remove();
  });

  it("sticks to the top as frosted glass on other pages", () => {
    pathname.current = "/blog";
    render(<Header />);
    const header = screen.getByRole("banner");
    expect(header).not.toHaveAttribute("data-over-video");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");
    expect(header.className).toContain("backdrop-blur-lg");
    expect(header.className).not.toContain("bg-background/40");
  });
});
