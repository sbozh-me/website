import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const compileError = vi.hoisted(() => ({ current: null as Error | null }));

vi.mock("@sbozh/pmdxjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sbozh/pmdxjs")>();
  return {
    ...actual,
    compile: (source: string) =>
      compileError.current ? { element: null, error: compileError.current } : actual.compile(source),
  };
});

import SidloPage, { metadata } from "./page";

async function renderPage(v?: string) {
  render(await SidloPage({ searchParams: Promise.resolve({ v }) }));
}

describe("SidloPage", () => {
  afterEach(() => {
    compileError.current = null;
  });

  it("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the official variant by default", async () => {
    await renderPage();
    expect(screen.getByRole("link", { name: "Stáhnout PDF" })).toHaveAttribute("href", "/api/sidlo/pdf?v=official");
    expect(screen.getByRole("link", { name: "Oficiální" })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: "Branded" })).toHaveAttribute("href", "/sidlo?v=branded");
  });

  it("renders the branded variant", async () => {
    await renderPage("branded");
    expect(screen.getByRole("link", { name: "Stáhnout PDF" })).toHaveAttribute("href", "/api/sidlo/pdf?v=branded");
    expect(screen.getByRole("link", { name: "Branded" })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: "Oficiální" })).toHaveAttribute("href", "/sidlo");
  });

  it("falls back to the official variant for an unknown one", async () => {
    await renderPage("nope");
    expect(screen.getByRole("link", { name: "Stáhnout PDF" })).toHaveAttribute("href", "/api/sidlo/pdf?v=official");
  });

  it("shows the compile error", async () => {
    compileError.current = new Error("Broken declaration");
    await renderPage();
    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByText("Broken declaration")).toBeInTheDocument();
  });
});
