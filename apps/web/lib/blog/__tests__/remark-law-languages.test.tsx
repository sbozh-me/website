import { createElement, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import remarkLawLanguages from "../remark-law-languages";

const components = {
  LawLanguageBlock: ({ lang, children }: { lang: string; children: ReactNode }) =>
    createElement("c-lang", { "data-lang": lang }, children),
};

async function render(source: string) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkLawLanguages],
  } as any);
  return renderToStaticMarkup(createElement(Content, { components }));
}

describe("remark-law-languages", () => {
  it("wraps a :::lang xx block in LawLanguageBlock", async () => {
    const html = await render(":::lang cs\n\nAhoj\n\n:::\n");
    expect(html).toContain('<c-lang data-lang="cs">');
    expect(html).toContain("Ahoj");
  });

  it("supports every allowed language code", async () => {
    for (const code of ["cs", "en", "ja", "uk", "ru"]) {
      const html = await render(`:::lang ${code}\n\nhi\n\n:::\n`);
      expect(html).toContain(`<c-lang data-lang="${code}">`);
    }
  });

  it("leaves unknown language codes alone", async () => {
    const html = await render(":::lang de\n\nHallo\n\n:::\n");
    expect(html).not.toContain("<c-lang");
    expect(html).toContain("Hallo");
  });

  it("wraps several blocks in one post", async () => {
    const html = await render(
      ":::lang cs\n\nAhoj\n\n:::\n\n:::lang en\n\nHello\n\n:::\n",
    );
    expect(html).toContain('<c-lang data-lang="cs">');
    expect(html).toContain('<c-lang data-lang="en">');
  });

  it("passes markdown inside the block through to children", async () => {
    const html = await render(":::lang en\n\n**bold**\n\n:::\n");
    expect(html).toContain('<c-lang data-lang="en">');
    expect(html).toContain("<strong>bold</strong>");
  });

  it("leaves content outside blocks untouched", async () => {
    const html = await render("Preamble\n\n:::lang cs\n\nTělo\n\n:::\n\nFooter\n");
    expect(html).toContain("Preamble");
    expect(html).toContain("Footer");
    expect(html).toContain('<c-lang data-lang="cs">');
  });

  it("does not transform an unmatched opener", async () => {
    const html = await render(":::lang cs\n\nAhoj\n");
    expect(html).not.toContain("<c-lang");
  });

  it("reads blocks written without blank lines around the fences", async () => {
    const html = await render(":::lang cs\nAhoj\n:::\n:::lang en\nHello\n:::\n");
    expect(html).toContain('<c-lang data-lang="cs"><p>Ahoj</p></c-lang>');
    expect(html).toContain('<c-lang data-lang="en"><p>Hello</p></c-lang>');
  });

  it("drops an empty :::lang block instead of rendering it", async () => {
    const html = await render(":::lang cs\n\n:::\n\n:::lang en\n\nHello\n\n:::\n");
    expect(html).not.toContain('data-lang="cs"');
    expect(html).toContain('<c-lang data-lang="en">');
  });

  it("reports the languages that have content through onLanguages", async () => {
    const seen: string[][] = [];
    const { default: Content } = await evaluate(
      ":::lang cs\n\n:::\n\n:::lang en\n\nHello\n\n:::\n\n:::lang ja\n\nこんにちは\n\n:::\n",
      {
        ...runtime,
        remarkPlugins: [remarkGfm, [remarkLawLanguages, { onLanguages: (codes) => seen.push(codes) }]],
      } as any,
    );
    renderToStaticMarkup(createElement(Content, { components }));
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual(["en", "ja"]);
  });
});
