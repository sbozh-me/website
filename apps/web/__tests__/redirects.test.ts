import { describe, expect, it } from "vitest";

import nextConfig from "../next.config";

describe("redirects", () => {
  it("sends the CV references link to the LinkedIn post, temporarily", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const link = redirects.find((r) => r.source === "/link/unfiltered-references");

    expect(link?.destination).toBe("https://lnkd.in/p/dKG-q7EC");
    // Must stay non-permanent: browsers cache 308s, which would pin every
    // scanned CV to the old target if the post ever moves
    expect(link?.permanent).toBe(false);
  });

  it("sends printed CV QR codes from /forum/<avatar>/cv to the new /cv page, temporarily", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];

    const engineer = redirects.find((r) => r.source === "/forum/sem-bozhyk/cv");
    expect(engineer?.destination).toBe("/cv?role=engineer");
    expect(engineer?.permanent).toBe(false);

    const founder = redirects.find((r) => r.source === "/forum/semen-bozhyk/cv");
    expect(founder?.destination).toBe("/cv?role=founder");
    expect(founder?.permanent).toBe(false);
  });
});
