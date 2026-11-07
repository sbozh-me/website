import { beforeEach, describe, expect, it, vi } from "vitest";

const getWallet = vi.fn();
vi.mock("@/lib/donations/repository", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/donations/repository")>()),
  getWallet: (...args: unknown[]) => getWallet(...args),
}));

import { REVEAL_LIMIT, revealLimiter } from "@/lib/donations/reveal";

import { POST } from "./route";

const ID = "8f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

function call(body: unknown, ip = "1.2.3.4") {
  return POST(
    new Request("http://localhost/api/donations/reveal", {
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      method: "POST",
    }),
  );
}

const valid = () => ({ id: ID, startedAt: Date.now() - 5_000, website: "" });

const wallet = {
  address: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  asset: "USDT",
  id: ID,
  memo: null,
  network: "tron",
  warning: null,
};

describe("POST /api/donations/reveal", () => {
  beforeEach(() => {
    revealLimiter.reset();
    getWallet.mockReset().mockResolvedValue(wallet);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the address, network warning and an SVG QR code", async () => {
    const response = await call(valid());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.wallet).toMatchObject({
      address: wallet.address,
      asset: "USDT",
      memo: null,
      networkLabel: "Tron (TRC-20)",
    });
    expect(body.wallet.warning).toMatch(/TRC-20/);
    expect(body.wallet.qr).toMatch(/^<svg/);
    expect(getWallet).toHaveBeenCalledWith(ID);
  });

  it("prefers a warning set in Directus", async () => {
    getWallet.mockResolvedValue({ ...wallet, warning: "Custom warning" });
    const body = await (await call(valid())).json();
    expect(body.wallet.warning).toBe("Custom warning");
  });

  it.each([
    ["malformed JSON", "{nope"],
    ["a non-UUID id", { ...valid(), id: "1" }],
    ["a filled honeypot", { ...valid(), website: "spam.example" }],
    ["an instant request", { ...valid(), startedAt: Date.now() }],
    ["a missing startedAt", { id: ID }],
  ])("refuses %s without touching Directus", async (_, body) => {
    const response = await call(body);
    expect(response.status).toBe(400);
    expect((await response.json()).reason).toBe("invalid");
    expect(getWallet).not.toHaveBeenCalled();
  });

  it("answers 404 for an unknown or unpublished wallet", async () => {
    getWallet.mockResolvedValue(null);
    const response = await call(valid());
    expect(response.status).toBe(404);
    expect((await response.json()).reason).toBe("not_found");
  });

  it("answers 502 when Directus fails", async () => {
    getWallet.mockRejectedValue(new Error("down"));
    const response = await call(valid());
    expect(response.status).toBe(502);
    expect((await response.json()).reason).toBe("unavailable");
  });

  it("rate-limits per IP", async () => {
    for (let i = 0; i < REVEAL_LIMIT; i++) {
      expect((await call(valid())).status).toBe(200);
    }
    const limited = await call(valid());
    expect(limited.status).toBe(429);
    expect((await limited.json()).reason).toBe("rate_limited");
    expect((await call(valid(), "5.6.7.8")).status).toBe(200);
  });
});
