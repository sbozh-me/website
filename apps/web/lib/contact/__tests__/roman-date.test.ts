import { describe, expect, it } from "vitest";

import { abUrbeCondita, romanDateLine, romanDay, toRoman } from "../roman-date";

const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));

describe("toRoman", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [14, "XIV"],
    [2026, "MMXXVI"],
    [2779, "MMDCCLXXIX"],
  ])("%i → %s", (n, roman) => {
    expect(toRoman(n)).toBe(roman);
  });

  it("returns empty for zero", () => {
    expect(toRoman(0)).toBe("");
  });
});

describe("romanDay", () => {
  it.each([
    [d(2026, 1, 1), "Kal. Ian."],
    [d(2026, 1, 2), "a.d. IV Non. Ian."],
    [d(2026, 1, 4), "prid. Non. Ian."],
    [d(2026, 1, 5), "Non. Ian."],
    [d(2026, 3, 7), "Non. Mart."],
    [d(2026, 3, 15), "Id. Mart."],
    [d(2026, 3, 14), "prid. Id. Mart."],
    [d(2026, 11, 6), "a.d. VIII Id. Nov."],
    [d(2026, 11, 13), "Id. Nov."],
    [d(2026, 11, 14), "a.d. XVIII Kal. Dec."],
    [d(2026, 11, 30), "prid. Kal. Dec."],
    [d(2026, 12, 31), "prid. Kal. Ian."],
    [d(2026, 12, 25), "a.d. VIII Kal. Ian."],
  ])("%s → %s", (date, expected) => {
    expect(romanDay(date)).toBe(expected);
  });
});

describe("romanDateLine", () => {
  it("adds the year and AUC", () => {
    expect(abUrbeCondita(d(2026, 11, 6))).toBe(2779);
    expect(romanDateLine(d(2026, 11, 6))).toBe("a.d. VIII Id. Nov. MMXXVI · AUC MMDCCLXXIX");
  });
});
