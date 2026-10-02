import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatReleaseDate, getRelativeTime } from "../../utils";

describe("formatReleaseDate", () => {
  it("formats as a short US date", () => {
    expect(formatReleaseDate("2026-10-02T12:00:00")).toBe("Oct 2, 2026");
  });
});

describe("getRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["2026-10-02T08:00:00Z", "Today"],
    ["2026-10-01T12:00:00Z", "Yesterday"],
    ["2026-09-28T12:00:00Z", "4 days ago"],
    ["2026-09-18T12:00:00Z", "2 weeks ago"],
    ["2026-08-01T12:00:00Z", "2 months ago"],
    ["2024-09-01T12:00:00Z", "2 years ago"],
  ])("%s reads as %s", (date, expected) => {
    expect(getRelativeTime(date)).toBe(expected);
  });
});
