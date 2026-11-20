import { describe, expect, it } from "vitest";

import { cipher } from "../cipher";

describe("cipher", () => {
  it("sets Latin letters and digits as their own capitals", () => {
    expect(cipher("17th Legion")).toBe("17TH LEGION");
  });

  it("gives every other character a capital or a digit, so none falls back to a readable font", () => {
    const shapes = cipher("ДАЙ ДЕНЕГ!");
    expect(shapes).toMatch(/^[A-Z0-9]{3} [A-Z0-9]{6}$/);
    expect(cipher("х✳й — «ß»?")).toMatch(/^[A-Z0-9]{3} [A-Z0-9] [A-Z0-9]{4}$/);
  });

  it("is the same every time, and tells letters apart", () => {
    expect(cipher("контекст")).toBe(cipher("контекст"));
    expect(new Set(cipher("абвгдежз")).size).toBeGreaterThan(4);
  });

  it("keeps the spaces, whatever kind, and the length", () => {
    expect(cipher("a\u00a0b\nc")).toBe("A B C");
    expect(cipher("a😀")).toHaveLength(2);
    expect(cipher("")).toBe("");
  });
});
