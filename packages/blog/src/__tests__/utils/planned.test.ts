import { describe, expect, it } from "vitest";

import { isPlannedDate } from "../../utils/planned";

const NOW = Date.parse("2026-11-15T12:00:00Z");

describe("isPlannedDate", () => {
  it("is planned while the publish time is ahead", () => {
    expect(isPlannedDate("2026-11-17T09:00:00Z", NOW)).toBe(true);
  });

  it("is out once the publish time has passed or is now", () => {
    expect(isPlannedDate("2026-11-14T09:00:00Z", NOW)).toBe(false);
    expect(isPlannedDate("2026-11-15T12:00:00Z", NOW)).toBe(false);
  });

  it("is not planned without a usable date", () => {
    expect(isPlannedDate(null, NOW)).toBe(false);
    expect(isPlannedDate(undefined, NOW)).toBe(false);
    expect(isPlannedDate("", NOW)).toBe(false);
    expect(isPlannedDate("not a date", NOW)).toBe(false);
  });
});
