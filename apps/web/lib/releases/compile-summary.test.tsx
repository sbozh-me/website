import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compileSummary } from "./compile-summary";

async function html(markdown: string) {
  return renderToStaticMarkup((await compileSummary(markdown)) as ReactNode);
}

describe("compileSummary", () => {
  it("renders plain markdown", async () => {
    const out = await html("## New Features\n\n- **Bold** item with ~~strike~~");
    expect(out).toContain("<h2>New Features</h2>");
    expect(out).toContain("<strong>Bold</strong>");
    expect(out).toContain("<del>strike</del>");
  });

  it("renders glitch words from the blog syntax", async () => {
    const out = await html("Kagurame is ==out|teal:loose==");
    expect(out).toContain('class="glitch');
    // The server renders the base state; the other states arrive with the bursts
    expect(out).toContain('<span class="glitch-sizer">out</span>');
  });

  it("renders the censor and the window toggle", async () => {
    const out = await html("х(;)й\n\n==WINDOW==");
    expect(out).toContain('class="censor"');
    expect(out).toContain("Window ON");
  });

  it("keeps a plain ==highlight== as a mark", async () => {
    expect(await html("a ==highlight== here")).toContain("<mark>highlight</mark>");
  });
});
