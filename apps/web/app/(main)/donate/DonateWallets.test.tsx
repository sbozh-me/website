import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

import { DonateWallets } from "./DonateWallets";

const ID = "8f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const mockFetch = vi.fn();
const writeText = vi.fn();

const wallets = [
  { asset: "USDT", id: ID, network: "tron" },
  { asset: "BTC", id: "1f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b", network: "bitcoin" },
];

function revealed(extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      ok: true,
      wallet: {
        address: ADDRESS,
        asset: "USDT",
        memo: null,
        network: "tron",
        networkLabel: "Tron (TRC-20)",
        qr: "<svg></svg>",
        warning: "Send only USDT over Tron (TRC-20).",
        ...extra,
      },
    }),
    { status: 200 },
  );
}

describe("DonateWallets", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    toast.success.mockReset();
    toast.error.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("shows labels only, then reveals one address with QR and warning", async () => {
    mockFetch.mockResolvedValue(revealed({ memo: "42" }));
    render(<DonateWallets wallets={wallets} />);
    expect(screen.queryByText(ADDRESS)).not.toBeInTheDocument();
    expect(screen.getByText("Tron (TRC-20)")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Show address/ })[0]);

    expect(await screen.findByText(ADDRESS)).toBeInTheDocument();
    expect(screen.getByText(/USDT over Tron/)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByAltText(/QR code for the USDT address/)).toHaveAttribute(
      "src",
      expect.stringMatching(/^data:image\/svg\+xml/),
    );
    // The other wallet stays hidden.
    expect(screen.getAllByRole("button", { name: /Show address/ })).toHaveLength(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/donations/reveal");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ id: ID, website: "" });
    expect(typeof body.startedAt).toBe("number");
  });

  it("copies the address and confirms with a toast", async () => {
    mockFetch.mockResolvedValue(revealed());
    render(<DonateWallets wallets={wallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Show address/ })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Copy USDT address" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(ADDRESS));
    expect(toast.success).toHaveBeenCalledWith("USDT address copied");
  });

  it("reports a failed copy", async () => {
    writeText.mockRejectedValue(new Error("denied"));
    mockFetch.mockResolvedValue(revealed());
    render(<DonateWallets wallets={wallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Show address/ })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Copy USDT address" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("explains a rate limit", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, reason: "rate_limited" }), { status: 429 }),
    );
    render(<DonateWallets wallets={wallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Show address/ })[0]);
    expect(await screen.findByText(/Too many requests/)).toBeInTheDocument();
  });

  it("shows a generic error when the request fails", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(<DonateWallets wallets={wallets} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Show address/ })[0]);
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });
});
