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
});
