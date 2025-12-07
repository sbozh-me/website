import { describe, expect, it } from "vitest";

import { formatReadingTime } from "../../utils/reading-time";

describe("formatReadingTime", () => {
  it("formats single minute", () => {
    expect(formatReadingTime(1)).toBe("1 min read");
  });

  it("formats multiple minutes", () => {
    expect(formatReadingTime(5)).toBe("5 min read");
  });

  it("formats larger values", () => {
    expect(formatReadingTime(15)).toBe("15 min read");
  });
});
