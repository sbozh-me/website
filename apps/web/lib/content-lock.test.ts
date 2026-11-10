import { afterEach, describe, expect, it, vi } from "vitest";

import {
  contentPassword,
  isPasswordCorrect,
  isUnlockTokenValid,
  unlockToken,
} from "./content-lock";

describe("content lock", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the static password", () => {
    vi.stubEnv("CONTENT_PASSWORD", "");
    expect(contentPassword()).toBe("sakeoflover26!");
    expect(isPasswordCorrect("sakeoflover26!")).toBe(true);
  });

  it("uses CONTENT_PASSWORD when set", () => {
    vi.stubEnv("CONTENT_PASSWORD", "other");
    expect(isPasswordCorrect("other")).toBe(true);
    expect(isPasswordCorrect("sakeoflover26!")).toBe(false);
  });

  it("rejects wrong or empty passwords", () => {
    expect(isPasswordCorrect("")).toBe(false);
    expect(isPasswordCorrect("sakeoflover26")).toBe(false);
  });

  it("never puts the password in the token", () => {
    expect(unlockToken()).not.toContain(contentPassword());
    expect(unlockToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts only the current token", () => {
    const token = unlockToken();
    expect(isUnlockTokenValid(token)).toBe(true);
    expect(isUnlockTokenValid(undefined)).toBe(false);
    expect(isUnlockTokenValid("nope")).toBe(false);

    vi.stubEnv("CONTENT_PASSWORD", "rotated");
    expect(isUnlockTokenValid(token)).toBe(false);
  });
});
