import { describe, expect, it } from "vitest";

import { networkInfo } from "../networks";

describe("networkInfo", () => {
  it("encodes Bitcoin addresses as bitcoin: URIs", () => {
    const info = networkInfo("bitcoin");
    expect(info.label).toBe("Bitcoin");
    expect(info.qrPayload("bc1qxyz")).toBe("bitcoin:bc1qxyz");
    expect(info.warning("BTC")).toMatch(/Bitcoin network/);
  });

  it("warns about TRC-20 for Tron", () => {
    const info = networkInfo("tron");
    expect(info.label).toBe("Tron (TRC-20)");
    expect(info.qrPayload("T123")).toBe("T123");
    expect(info.warning("USDT")).toMatch(/USDT over Tron \(TRC-20\)/);
  });

  it("distinguishes native NEAR from tokens on NEAR", () => {
    const info = networkInfo("near");
    expect(info.warning("NEAR")).toBe("Send only NEAR on NEAR mainnet.");
    expect(info.warning("USDT")).toMatch(/NEP-141/);
  });

  it("falls back for networks it does not know", () => {
    const info = networkInfo("solana");
    expect(info.label).toBe("solana");
    expect(info.qrPayload("abc")).toBe("abc");
    expect(info.warning("SOL")).toBe("Send only SOL on the solana network.");
  });
});
