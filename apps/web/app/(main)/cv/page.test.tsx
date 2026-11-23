import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/cv",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import CVPage from "./page";

async function renderPage(params: { role?: string; lang?: string } = {}) {
  render(await CVPage({ searchParams: Promise.resolve(params) }));
}

describe("CVPage", () => {
  it("defaults to the engineer EN CV", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sem Bozhyk");
    expect(screen.getByRole("heading", { level: 2, name: "Sem Bozhyk's CV" })).toBeInTheDocument();
  });

  it("switches to the Ukrainian engineer CV when asked", async () => {
    await renderPage({ role: "engineer", lang: "uk" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Семен Божик");
    expect(screen.getByRole("heading", { level: 2, name: "CV Семена Божика" })).toBeInTheDocument();
  });

  it("switches to the founder EN CV when asked", async () => {
    await renderPage({ role: "founder", lang: "en" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Semen Bozhyk");
    expect(screen.getByRole("heading", { level: 2, name: "Semen Bozhyk's CV" })).toBeInTheDocument();
  });

  it("switches to the founder Ukrainian CV when asked", async () => {
    await renderPage({ role: "founder", lang: "uk" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Семен Божик");
    expect(screen.getByRole("heading", { level: 2, name: "CV Семена Божика" })).toBeInTheDocument();
  });

  it("shows pickers for role and language, and the download, print, and theme controls", async () => {
    await renderPage();
    expect(screen.getByRole("group", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Engineer" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Co-Founder" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /download cv as pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /print cv/i })).toBeInTheDocument();
  });

  it("falls back to defaults on unknown values", async () => {
    await renderPage({ role: "bogus", lang: "fr" });
    expect(screen.getByRole("heading", { level: 2, name: "Sem Bozhyk's CV" })).toBeInTheDocument();
  });
});
