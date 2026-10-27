import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BlogRepository, Post, PostListItem } from "@sbozh/blog";

import { withPlainTitles } from "../repository";
import { hasTitleMarkup, plainTitle, titleMarkdown } from "../title";
import { renderTitle } from "../title-heading";

describe("plainTitle", () => {
  it("reads glitch words as their base state and censors as ✳", async () => {
    expect(await plainTitle("==Yeter|ENOUGH!==")).toBe("Yeter");
    expect(await plainTitle("Нах(;)й, ==себя|teal:US==")).toBe("Нах✳й, себя");
    expect(await plainTitle("==D(;)ck pitch== and ==sbozhed==")).toBe("D✳CK PITCH and sbozhed");
  });

  it("drops inline markdown and keeps plain titles as they are", async () => {
    expect(await plainTitle("Some **bold** `code`")).toBe("Some bold code");
    expect(await plainTitle("Why I started sbozh.me")).toBe("Why I started sbozh.me");
  });

  it("keeps titles that look like blocks, JSX or expressions as text", async () => {
    expect(await plainTitle("1. ==a|b==")).toBe("1. a");
    expect(await plainTitle("# ==a|b==")).toBe("# a");
    expect(await plainTitle("a < b {c} ==d|e==")).toBe("a < b {c} d");
  });
});

describe("titleMarkdown", () => {
  it("escapes only what would start a block", () => {
    expect(titleMarkdown("1. Intro")).toBe("1\\. Intro");
    expect(titleMarkdown("- item")).toBe("\\- item");
    expect(titleMarkdown("> quote")).toBe("\\> quote");
    expect(titleMarkdown("**bold** start")).toBe("**bold** start");
  });

  it("detects markup", () => {
    expect(hasTitleMarkup("==a|b==")).toBe(true);
    expect(hasTitleMarkup("Plain title")).toBe(false);
  });
});

describe("renderTitle", () => {
  it("renders glitch syntax without a paragraph", async () => {
    const html = renderToStaticMarkup(<>{await renderTitle("==Yeter|ENOUGH!==")}</>);
    expect(html).not.toContain("<p>");
    expect(html).not.toContain("==");
    // A glitch word at rest shows its base; the alt state comes with a burst
    expect(html).toContain('class="glitch"');
    expect(html).toContain("Yeter");
  });

  it("returns plain titles untouched", async () => {
    expect(await renderTitle("Plain title")).toBe("Plain title");
  });
});

describe("withPlainTitles", () => {
  const post = { id: "1", slug: "yeter", title: "==Yeter|ENOUGH!==" } as Post;
  const plain = { id: "2", slug: "plain", title: "Plain" } as PostListItem;
  const repository = withPlainTitles({
    getPosts: async () => [post, plain],
    getPost: async (slug) => (slug === "yeter" ? post : null),
    getPersonas: async () => [],
    getTags: async () => [],
  } as BlogRepository);

  it("gives lists the plain title", async () => {
    expect((await repository.getPosts()).map((p) => p.title)).toEqual(["Yeter", "Plain"]);
  });

  it("keeps the markup on a single post for its heading", async () => {
    const single = await repository.getPost("yeter");
    expect(single?.title).toBe("Yeter");
    expect(single?.titleMarkup).toBe("==Yeter|ENOUGH!==");
    expect(await repository.getPost("missing")).toBeNull();
  });
});
