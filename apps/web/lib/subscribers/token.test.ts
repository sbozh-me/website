import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createToken, verifyToken } from "./token";

describe("subscription tokens", () => {
  beforeEach(() => {
    vi.stubEnv("SUBSCRIBE_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips a confirm token", () => {
    const payload = verifyToken(createToken("a@b.co", "confirm"));

    expect(payload).toMatchObject({ email: "a@b.co", action: "confirm" });
  });

  it("carries topics on confirm tokens only", () => {
    expect(verifyToken(createToken("a@b.co", "confirm", Date.now(), ["blog"]))?.topics).toEqual(["blog"]);
    expect(verifyToken(createToken("a@b.co", "unsubscribe", Date.now(), ["blog"]))?.topics).toBeUndefined();
  });

  it("expires confirm tokens after a week", () => {
    const token = createToken("a@b.co", "confirm", 0);
    const week = 7 * 24 * 60 * 60 * 1000;

    expect(verifyToken(token, week)).not.toBeNull();
    expect(verifyToken(token, week + 1)).toBeNull();
  });

  it("never expires unsubscribe tokens", () => {
    const token = createToken("a@b.co", "unsubscribe", 0);

    expect(verifyToken(token, Number.MAX_SAFE_INTEGER)).toMatchObject({ action: "unsubscribe" });
  });

  it("rejects a tampered payload", () => {
    const [, signature] = createToken("a@b.co", "confirm").split(".");
    const forged = Buffer.from(JSON.stringify({ email: "x@y.co", action: "confirm" })).toString("base64url");

    expect(verifyToken(`${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = createToken("a@b.co", "confirm");
    vi.stubEnv("SUBSCRIBE_SECRET", "other-secret");

    expect(verifyToken(token)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyToken("")).toBeNull();
    expect(verifyToken("abc")).toBeNull();
    expect(verifyToken("a.b.c")).toBeNull();
  });

  it("throws without a configured secret", () => {
    vi.stubEnv("SUBSCRIBE_SECRET", "");

    expect(() => createToken("a@b.co", "confirm")).toThrow("SUBSCRIBE_SECRET");
  });
});
