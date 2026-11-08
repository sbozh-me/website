import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { isSafeUrl } from "../remark-submission-safe";
import { estimateReadingTime, renderSubmission, splitFrontmatter, splitTldr } from "../submission-preview";

async function html(source: string) {
  const result = await renderSubmission(source);
  if (!result.ok) throw new Error(result.error);
  return renderToStaticMarkup(<>{result.content}</>);
}

describe("splitFrontmatter", () => {
  it("lifts title, author and excerpt out of the body", () => {
    const { meta, body } = splitFrontmatter('---\ntitle: "Hi"\nauthor: Me\nexcerpt: Short\n---\n\nBody');
    expect(meta).toEqual({ author: "Me", excerpt: "Short", tags: [], title: "Hi", tldr: undefined });
    expect(body.trim()).toBe("Body");
  });

  it("leaves text without frontmatter alone", () => {
    expect(splitFrontmatter("Just text\n---\nmore")).toEqual({ body: "Just text\n---\nmore", meta: { tags: [] } });
  });

  it("reads tags as a list or comma separated", () => {
    expect(splitFrontmatter("---\ntags: [AI, \"Mental Horror\"]\n---\n").meta.tags).toEqual(["AI", "Mental Horror"]);
    expect(splitFrontmatter("---\ntags: a, b\n---\n").meta.tags).toEqual(["a", "b"]);
  });
});

describe("splitTldr", () => {
  it("lifts a leading TL;DR paragraph off the body", () => {
    expect(splitTldr("**TL;DR:** Short\nstill tldr\n\nBody")).toEqual({ body: "Body", tldr: "Short\nstill tldr" });
    expect(splitTldr("TL;DR: plain\n\nBody")).toEqual({ body: "Body", tldr: "plain" });
  });

  it("prefers the frontmatter and leaves other text alone", () => {
    expect(splitTldr("**TL;DR:** in body", "from meta")).toEqual({ body: "**TL;DR:** in body", tldr: "from meta" });
    expect(splitTldr("Intro\n\n**TL;DR:** late")).toEqual({ body: "Intro\n\n**TL;DR:** late" });
  });
});

describe("estimateReadingTime", () => {
  it("rounds up at 200 words a minute, at least one", () => {
    expect(estimateReadingTime("")).toBe(1);
    expect(estimateReadingTime("word ".repeat(201))).toBe(2);
  });
});

describe("renderSubmission", () => {
  it("renders the glitch syntax and voices", async () => {
    const out = await html('Me, ==the Princeps|gold:Semen==.\n\n<Voice color="teal">\n\n— Ave.\n\n</Voice>');
    expect(out).toContain("the Princeps");
    expect(out).toContain("Semen");
    expect(out).toContain('data-voice="teal"');
  });

  it("renders the whole Binary Answer post", async () => {
    const source = readFileSync(join(__dirname, "fixtures/the-binary-answer.md"), "utf8");
    const result = await renderSubmission(source);
    expect(result.ok).toBe(true);
    expect(result.meta.title).toBe("The Binary Answer");
    expect(result.meta.excerpt).toMatch(/^I asked my AI to play Augustus/);
    expect(result.meta.tags).toContain("Mental Horror");
    if (!result.ok) return;
    expect(result.toc.map((item) => item.text)).toContain("The binary answer");
    expect(renderToStaticMarkup(<>{result.tldr}</>)).toContain("Augustus");
    const out = renderToStaticMarkup(<>{result.ok && result.content}</>);
    expect(out).toContain('id="who-is-speaking"');
    expect(out).not.toContain("TL;DR");
    expect(out).toContain("I call someone.");
    expect(out).not.toContain("title: The Binary Answer");
  });

  it("reports a parse error instead of throwing", async () => {
    const result = await renderSubmission("fine\n\n<Voice color=\"teal\">\n\nnever closed");
    expect(result.ok).toBe(false);
    // MDX has no position for a tag left open at the end, so no line number here
    if (!result.ok) expect(result.error).toMatch(/closing tag for `<Voice>`/);
  });

  it("counts error lines from the top of the writer's text, frontmatter included", async () => {
    const result = await renderSubmission("---\ntitle: T\n---\nok\n\nbad {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Line 6:/);
  });
});

describe("remark-submission-safe", () => {
  it("never runs expressions, imports or exports", async () => {
    const spy = vi.fn();
    (globalThis as Record<string, unknown>).__pwned = spy;
    const out = await html(
      "export const x = globalThis.__pwned()\n\nHi {globalThis.__pwned()} there\n\n{globalThis.__pwned()}",
    );
    expect(spy).not.toHaveBeenCalled();
    expect(out).toContain("{globalThis.__pwned()}");
    expect(out).toContain("export const x");
    delete (globalThis as Record<string, unknown>).__pwned;
  });

  it("unwraps unknown tags and strips their attributes", async () => {
    const out = await html('<script>alert(1)</script>\n\n<div onClick={() => 1}>inside</div>\n\n<img src="x" onError="alert(1)" />');
    expect(out).not.toMatch(/<script|<img|onclick|onerror/i);
    expect(out).toContain("inside");
  });

  it("keeps only a known colour on Voice", async () => {
    expect(await html('<Voice color="teal" onClick={() => 1}>\n\nhi\n\n</Voice>')).toContain('data-voice="teal"');
    const unknown = await html('<Voice color="constructor">\n\nhi\n\n</Voice>');
    expect(unknown).not.toContain("data-voice");
    expect(unknown).toContain("hi");
    expect(await html("<Voice color={evil}>\n\nhi\n\n</Voice>")).not.toContain("data-voice");
  });

  it("disarms links with a dangerous scheme", async () => {
    const out = await html("[a](javascript:alert(1)) [b](https://sbozh.me) ![c](data:text/html,x) [d](/blog)");
    expect(out).not.toMatch(/javascript:|data:text/);
    expect(out).toContain('href="https://sbozh.me"');
    expect(out).toContain('href="/blog"');
  });

  it.each([
    ["https://x.y", true],
    ["mailto:a@b.c", true],
    ["#top", true],
    ["../post", true],
    ["post", true],
    ["javascript:alert(1)", false],
    [" JavaScript:alert(1)", false],
    ["vbscript:x", false],
    ["data:text/html,x", false],
  ])("isSafeUrl(%s) is %s", (url, safe) => {
    expect(isSafeUrl(url)).toBe(safe);
  });
});
