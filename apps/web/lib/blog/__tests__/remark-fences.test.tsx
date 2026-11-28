import { createElement, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import remarkAiVariants from "../remark-ai-variants";
import remarkBigText from "../remark-big-text";
import remarkLawLanguages from "../remark-law-languages";

const components = {
  LawLanguageBlock: ({ lang, children }: { lang: string; children: ReactNode }) =>
    createElement("c-lang", { "data-lang": lang }, children),
  AiVariantBlock: ({ variant, children }: { variant: string; children: ReactNode }) =>
    createElement("c-ai", { "data-variant": variant }, children),
  BigText: ({ children }: { children: ReactNode }) => createElement("c-big", null, children),
};

async function render(source: string, plugins: unknown[]) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, ...plugins],
  } as any);
  return renderToStaticMarkup(createElement(Content, { components }));
}

const all = [remarkBigText, remarkAiVariants, remarkLawLanguages];

describe("remark-big-text", () => {
  it("wraps a :::big block in BigText", async () => {
    const html = await render(":::big\n\nI'm Spartacus\n\n:::\n", [remarkBigText]);
    expect(html).toBe("<c-big><p>I&#x27;m Spartacus</p></c-big>");
  });

  it("reads the compact form without blank lines", async () => {
    const html = await render(":::big\nI'm Spartacus\n:::\n\nThe question", [remarkBigText]);
    expect(html).toBe("<c-big><p>I&#x27;m Spartacus</p></c-big>\n<p>The question</p>");
  });

  it("keeps inline markdown inside the compact form", async () => {
    const html = await render(":::big\n**D*CK** pitch\nsecond line\n:::", [remarkBigText]);
    expect(html).toBe("<c-big><p><strong>D*CK</strong> pitch\nsecond line</p></c-big>");
  });

  it("splits text before and after fences in one paragraph", async () => {
    const html = await render("Before\n:::big\nBig\n:::\nAfter", [remarkBigText]);
    expect(html).toBe("<p>Before</p>\n<c-big><p>Big</p></c-big>\n<p>After</p>");
  });

  it("is not a heading", async () => {
    const html = await render(":::big\n\nTitle\n\n:::\n", [remarkBigText]);
    expect(html).not.toMatch(/<h\d/);
  });

  it("leaves :::big with an argument, an unmatched opener and code alone", async () => {
    expect(await render(":::big x\n\nHi\n\n:::\n", [remarkBigText])).not.toContain("<c-big");
    expect(await render(":::big\n\nHi\n", [remarkBigText])).not.toContain("<c-big");
    expect(await render("```\n:::big\nHi\n:::\n```\n", [remarkBigText])).not.toContain("<c-big");
  });

  it("drops an empty block", async () => {
    expect(await render(":::big\n:::\n\nText", [remarkBigText])).toBe("<p>Text</p>");
  });
});

describe("remark-ai-variants", () => {
  it("wraps :::ai and :::nai blocks and reports the variants", async () => {
    let seen: string[] = [];
    const html = await render(":::ai\n\nWith AI\n\n:::\n\n:::nai\n\nWithout AI\n\n:::\n", [
      [remarkAiVariants, { onVariants: (variants: string[]) => (seen = variants) }],
    ]);
    expect(html).toContain('<c-ai data-variant="ai"><p>With AI</p></c-ai>');
    expect(html).toContain('<c-ai data-variant="nai"><p>Without AI</p></c-ai>');
    expect(seen).toEqual(["ai", "nai"]);
  });

  it("does not report an empty variant", async () => {
    let seen: string[] = [];
    const html = await render(":::ai\n:::\n\n:::nai\nOnly human\n:::", [
      [remarkAiVariants, { onVariants: (variants: string[]) => (seen = variants) }],
    ]);
    expect(html).toBe('<c-ai data-variant="nai"><p>Only human</p></c-ai>');
    expect(seen).toEqual(["nai"]);
  });

  it("works without a callback and leaves unknown fences alone", async () => {
    const html = await render(":::aix\n\nHi\n\n:::\n", [remarkAiVariants]);
    expect(html).not.toContain("<c-ai");
  });
});

describe("nested fences", () => {
  it("holds :::lang and :::big blocks inside :::ai, whatever the plugin order", async () => {
    const source = [
      ":::ai",
      ":::big\nBig\n:::",
      ":::lang cs\n\nAhoj\n\n:::",
      ":::lang en\n\nHello\n\n:::",
      ":::",
      ":::nai\n\nHuman\n\n:::",
    ].join("\n\n");
    const expected =
      '<c-ai data-variant="ai"><c-big><p>Big</p></c-big>' +
      '<c-lang data-lang="cs"><p>Ahoj</p></c-lang>' +
      '<c-lang data-lang="en"><p>Hello</p></c-lang></c-ai>\n' +
      '<c-ai data-variant="nai"><p>Human</p></c-ai>';
    expect(await render(source, all)).toBe(expected);
    expect(await render(source, [...all].reverse())).toBe(expected);
  });

  it("holds :::ai blocks inside :::lang", async () => {
    const source = ":::lang en\n\n:::ai\n\nAI\n\n:::\n\n:::nai\n\nHuman\n\n:::\n\n:::";
    const expected =
      '<c-lang data-lang="en"><c-ai data-variant="ai"><p>AI</p></c-ai>' +
      '<c-ai data-variant="nai"><p>Human</p></c-ai></c-lang>';
    expect(await render(source, all)).toBe(expected);
    expect(await render(source, [...all].reverse())).toBe(expected);
  });

  it("finds fences inside JSX blocks the author wrote", async () => {
    const html = await render("<section>\n\n:::big\n\nBig\n\n:::\n\n</section>", [remarkBigText]);
    expect(html).toBe("<section><c-big><p>Big</p></c-big></section>");
  });

  it("counts fences no plugin claims, so their closers don't end the block", async () => {
    const source = ":::ai\n\n:::note\n\nInner\n\n:::\n\nStill AI\n\n:::";
    const html = await render(source, [remarkAiVariants]);
    expect(html).toMatch(/^<c-ai data-variant="ai">.*Still AI<\/p><\/c-ai>$/s);
  });
});
