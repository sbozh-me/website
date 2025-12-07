import { describe, expect, it } from "vitest";

import { formatShortDate } from "../../utils/date-format";

describe("formatShortDate", () => {
  it("formats January date", () => {
    expect(formatShortDate("2024-01-15")).toBe("Jan 15");
  });

  it("formats June date", () => {
    expect(formatShortDate("2024-06-01")).toBe("Jun 1");
  });

  it("formats December date", () => {
    expect(formatShortDate("2024-12-31")).toBe("Dec 31");
  });

  it("formats all months correctly", () => {
    const months = [
      { date: "2024-01-01", expected: "Jan" },
      { date: "2024-02-01", expected: "Feb" },
      { date: "2024-03-01", expected: "Mar" },
      { date: "2024-04-01", expected: "Apr" },
      { date: "2024-05-01", expected: "May" },
      { date: "2024-06-01", expected: "Jun" },
      { date: "2024-07-01", expected: "Jul" },
      { date: "2024-08-01", expected: "Aug" },
      { date: "2024-09-01", expected: "Sep" },
      { date: "2024-10-01", expected: "Oct" },
      { date: "2024-11-01", expected: "Nov" },
      { date: "2024-12-01", expected: "Dec" },
    ];

    for (const { date, expected } of months) {
      expect(formatShortDate(date)).toContain(expected);
    }
  });
});
