import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDonationsPage = vi.fn();
vi.mock("@/lib/donations/repository", () => ({
  getDonationsPage: () => getDonationsPage(),
}));

import DonatePage from "./page";

const ID = "8f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("DonatePage", () => {
  beforeEach(() => {
    getDonationsPage.mockReset();
  });

  it("renders the Directus intro as paragraphs and the wallets without addresses", async () => {
    getDonationsPage.mockResolvedValue({
      intro: "First paragraph.\n\nSecond paragraph.",
      wallets: [{ asset: "USDT", id: ID, network: "tron" }],
    });
    const { container } = render(await DonatePage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Donate");
    expect(screen.getByText("First paragraph.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("USDT");
    expect(screen.getByText("Tron (TRC-20)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show address/ })).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/T[1-9A-HJ-NP-Za-km-z]{33}/);
  });

  it("falls back to a default intro and an empty-state note", async () => {
    getDonationsPage.mockResolvedValue({ intro: null, wallets: [] });
    render(await DonatePage());
    expect(screen.getByText(/support the work with crypto/)).toBeInTheDocument();
    expect(screen.getByText(/not available right now/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
