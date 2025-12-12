import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots.ts", () => {
  it("returns correct robots configuration", () => {
    const result = robots();

    expect(result.rules).toEqual([
      {
        userAgent: "*",
        allow: "/",
        disallow: "/cv",
      },
    ]);
  });

  it("includes sitemap URL", () => {
    const result = robots();

    expect(result.sitemap).toBe("https://sbozh.me/sitemap.xml");
  });

  it("disallows /cv route", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const mainRule = rules[0];

    expect(mainRule?.disallow).toBe("/cv");
  });
});
