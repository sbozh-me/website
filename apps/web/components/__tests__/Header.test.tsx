import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ current: "/blog" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { setGlitchesEnabled, useWindowStartsClosed } from "@/lib/blog/glitch/window";
import { Header } from "../Header";

const press = () =>
  act(() => void document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, code: "KeyW", key: "w" })));

afterEach(() => {
  pathname.current = "/blog";
  act(() => setGlitchesEnabled(null));
});

describe("Header", () => {
  it("centres the brand with Personal startup under it, never wider than sbozh.me", () => {
    render(<Header />);
    const brand = screen.getByRole("banner").querySelector("[data-brand]")!;
    expect(brand).toContainElement(screen.getByRole("link", { name: "sbozh.me" }));
    // The tagline leads home too
    const tagline = screen.getByRole("link", { name: "Personal startup" });
    expect(tagline).toHaveAttribute("href", "/");
    expect(brand).toContainElement(tagline);
    // Its row takes the brand's width instead of setting it
    expect(tagline.parentElement).toHaveClass("w-0", "min-w-full");
  });

  it("keeps the menu links", () => {
    render(<Header />);
    for (const name of ["Home", "Blog", "Forum", "Projects"]) {
      expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0);
    }
  });

  it("switches the theme with an icon, no wording", () => {
    render(<Header />);
    const theme = screen.getByRole("button", { name: "Switch to the white reading theme" });
    expect(theme).not.toHaveTextContent(/White|Dark/);
  });

  it("carries the Window button on every page, with the W hotkey", () => {
    render(<Header />);
    expect(screen.getByRole("button", { name: /Window ON/ })).toHaveAttribute("aria-pressed", "true");
    press();
    expect(screen.getByRole("button", { name: /Window OFF/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows OFF on a page that starts with the window closed (Kagurame, ==WINDOW OFF==)", () => {
    function Closer() {
      useWindowStartsClosed();
      return null;
    }
    render(
      <>
        <Header />
        <Closer />
      </>
    );
    fireEvent.click(screen.getByRole("button", { name: /Window OFF/ }));
    expect(screen.getByRole("button", { name: /Window ON/ })).toBeInTheDocument();
  });

  it("starts each new page at its own default", () => {
    const { rerender } = render(<Header />);
    press();
    expect(screen.getByRole("button", { name: /Window OFF/ })).toBeInTheDocument();
    pathname.current = "/forum";
    rerender(<Header />);
    expect(screen.getByRole("button", { name: /Window ON/ })).toBeInTheDocument();
  });
});
