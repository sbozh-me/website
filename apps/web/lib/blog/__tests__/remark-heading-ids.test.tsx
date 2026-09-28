import { createElement, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import type { TOCItem } from "@sbozh/blog/utils";

import remarkGlitch from "../remark-glitch";
import remarkHeadingIds from "../remark-heading-ids";

const components = {
  Censor: () => createElement("i", null, "✳"),
  DickPitch: () => createElement("b", null, "D✳CK PITCH"),
  WindowToggle: () => createElement("button", null, "Window ON"),
  Glitch: ({ children }: { children: ReactNode }) => createElement("span", null, children),
  GlitchState: ({ children }: { children: ReactNode }) => createElement("span", null, children),
};

async function compile(source: string, withIds = true) {
  let toc: TOCItem[] = [];
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: withIds
      ? [remarkGfm, remarkGlitch, [remarkHeadingIds, { onHeadings: (items: TOCItem[]) => (toc = items) }]]
      : [remarkGfm, remarkGlitch],
    rehypePlugins: [rehypeSlug],
  } as any);
  const html = renderToStaticMarkup(<Content components={components} />);
  const ids = [...html.matchAll(/<h\d id="([^"]*)"/g)].map((m) => m[1]);
  return { toc, ids };
}

describe("remarkHeadingIds", () => {
  it("lists h2-h4 for the TOC, skipping h1, h5 and h6", async () => {
    const { toc } = await compile("# One\n\n## Two\n\n### Three\n\n#### Four\n\n##### Five\n\n###### Six");
    expect(toc).toEqual([
      { id: "two", text: "Two", level: 2 },
      { id: "three", text: "Three", level: 3 },
      { id: "four", text: "Four", level: 4 },
    ]);
  });

  it("reads a glitch heading as its base state, without the syntax", async () => {
    const { toc, ids } = await compile("## Дарио, так какой ==||white:стул|D(;)ck pitch==?");
    expect(toc).toEqual([{ id: "дарио-так-какой-стул", text: "Дарио, так какой стул?", level: 2 }]);
    // the anchor the TOC links to is the heading's id
    expect(ids).toEqual(["дарио-так-какой-стул"]);
  });

  it("reads censors, the brand and inline markup as text", async () => {
    const { toc } = await compile("## Нах(;)й **корпоративной** `работы`\n\n### ==D(;)ck pitch== и [Tecraft](/x)");
    expect(toc.map((item) => item.text)).toEqual(["Нах✳й корпоративной работы", "D✳CK PITCH и Tecraft"]);
  });

  it("numbers duplicates like rehype-slug", async () => {
    const { toc, ids } = await compile("## ==Cultural fit|a==\n\n## Cultural fit\n\n#### Cultural fit");
    expect(toc.map((item) => item.id)).toEqual(["cultural-fit", "cultural-fit-1", "cultural-fit-2"]);
    expect(ids).toEqual(["cultural-fit", "cultural-fit-1", "cultural-fit-2"]);
  });

  it("keeps the ids rehype-slug gave headings without glitch syntax", async () => {
    const source = [
      "# Title",
      "## Дарио, так какой стул?",
      "## Cultural fit",
      "### Подготовка.",
      "#### Так что же общего и у меня и у Дарио?",
      "#### 1D",
      "## Cultural fit",
      "### `code` and **bold**",
    ].join("\n\n");
    const before = await compile(source, false);
    const after = await compile(source);
    expect(after.ids).toEqual(before.ids);
  });
});
