import { createElement, type ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import remarkGlitch from "../remark-glitch";

// Stubs that render the plugin's output as compact, assertable markup (custom tags
// via createElement, since JSX only types known intrinsic elements).
const components = {
  Censor: () => createElement("c-censor"),
  DickPitch: () => createElement("c-brand"),
  Glitch: ({ blink, children }: { blink?: boolean; children: ReactNode }) =>
    createElement("c-glitch", { "data-blink": blink ? "" : undefined }, children),
  GlitchState: ({ children, color, plain }: { children: ReactNode; color?: string; plain?: boolean }) =>
    createElement("c-state", { "data-color": color, "data-plain": plain ? "" : undefined }, children),
};

async function render(source: string) {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkGlitch],
  } as any);
  return renderToStaticMarkup(<Content components={components} />);
}

describe("remarkGlitch", () => {
  describe("(;) censor", () => {
    it("replaces the marker inside a word", async () => {
      expect(await render("Нах(;)й корпоративной работы")).toBe(
        "<p>Нах<c-censor></c-censor>й корпоративной работы</p>",
      );
    });

    it("handles several censors in one text run", async () => {
      expect(await render("з(;)бись и х(;)й")).toBe(
        "<p>з<c-censor></c-censor>бись и х<c-censor></c-censor>й</p>",
      );
    });

    it("works inside emphasis and link text", async () => {
      expect(await render("*х(;)й* [D(;)ck](/x)")).toBe(
        '<p><em>х<c-censor></c-censor>й</em> <a href="/x">D<c-censor></c-censor>ck</a></p>',
      );
    });

    it("leaves inline code and code blocks alone", async () => {
      expect(await render("`х(;)й`\n\n```\nх(;)й\n```")).toBe(
        "<p><code>х(;)й</code></p>\n<pre><code>х(;)й\n</code></pre>",
      );
    });

    it("can be escaped", async () => {
      expect(await render("smile \\(;)")).toBe("<p>smile (;)</p>");
    });
  });

  describe("==base|alt== glitch", () => {
    it("builds a glitch with two states", async () => {
      expect(await render("Для ==себя|US==.")).toBe(
        "<p>Для <c-glitch><c-state>себя</c-state><c-state>US</c-state></c-glitch>.</p>",
      );
    });

    it("supports more than two states", async () => {
      expect(await render("==заметили|Форточка|Window==")).toBe(
        "<p><c-glitch><c-state>заметили</c-state><c-state>Форточка</c-state><c-state>Window</c-state></c-glitch></p>",
      );
    });

    it("marks a trailing ! as blinking and strips it", async () => {
      expect(await render("продавать ==стекло|GLASS!==")).toBe(
        "<p>продавать <c-glitch data-blink=\"\"><c-state>стекло</c-state><c-state>GLASS</c-state></c-glitch></p>",
      );
    });

    it("keeps an escaped ! as text instead of blinking", async () => {
      expect(await render("==стекло|GLASS\\!==")).toBe(
        "<p><c-glitch><c-state>стекло</c-state><c-state>GLASS!</c-state></c-glitch></p>",
      );
    });

    it("keeps an escaped | inside a state", async () => {
      expect(await render("==a\\|b|c==")).toBe(
        "<p><c-glitch><c-state>a|b</c-state><c-state>c</c-state></c-glitch></p>",
      );
    });

    it("keeps multi-word states and trims spaces around |", async () => {
      expect(await render("к ==квази-инженеру | Петух: ряженый== который")).toBe(
        "<p>к <c-glitch><c-state>квази-инженеру</c-state><c-state>Петух: ряженый</c-state></c-glitch> который</p>",
      );
    });

    it("lets states contain strikethrough and other inline nodes", async () => {
      expect(await render("помогла ==~~суи...~~|камминг-аут==.")).toBe(
        "<p>помогла <c-glitch><c-state><del>суи...</del></c-state><c-state>камминг-аут</c-state></c-glitch>.</p>",
      );
    });

    it("censors inside a state (plain censor, not the brand)", async () => {
      expect(await render("куда сесть ==сесть|D(;)ck==?")).toBe(
        "<p>куда сесть <c-glitch><c-state>сесть</c-state><c-state>D<c-censor></c-censor>ck</c-state></c-glitch>?</p>",
      );
    });

    it("handles several glitches in one paragraph", async () => {
      expect(await render("==мой|our== и ==нас|us==")).toBe(
        "<p><c-glitch><c-state>мой</c-state><c-state>our</c-state></c-glitch> и <c-glitch><c-state>нас</c-state><c-state>us</c-state></c-glitch></p>",
      );
    });

    it("works in headings", async () => {
      expect(await render("## ==Cultural fit|залупа коня==")).toBe(
        '<h2><c-glitch><c-state>Cultural fit</c-state><c-state>залупа коня</c-state></c-glitch></h2>',
      );
    });

    it("marks a state after || as plain", async () => {
      expect(await render("==LOL|No||yes==")).toBe(
        '<p><c-glitch><c-state>LOL</c-state><c-state>No</c-state><c-state data-plain="">yes</c-state></c-glitch></p>',
      );
    });

    it("a leading || makes the base plain", async () => {
      expect(await render("==||yes|No==")).toBe(
        '<p><c-glitch><c-state data-plain="">yes</c-state><c-state>No</c-state></c-glitch></p>',
      );
    });

    it("a lone plain state isn't a glitch", async () => {
      expect(await render("==||yes==")).toBe("<p>==||yes==</p>");
    });

    it("plain states can blink", async () => {
      expect(await render("==a||b!==")).toBe(
        '<p><c-glitch data-blink=""><c-state>a</c-state><c-state data-plain="">b</c-state></c-glitch></p>',
      );
    });

    it("picks a colour with a gold/purple/teal/white/red prefix", async () => {
      expect(await render("==purple:себя|GOLD:US||teal:yes|White:x|red: censored==")).toBe(
        "<p><c-glitch>" +
          '<c-state data-color="purple">себя</c-state>' +
          '<c-state data-color="gold">US</c-state>' +
          '<c-state data-color="teal" data-plain="">yes</c-state>' +
          '<c-state data-color="white">x</c-state>' +
          '<c-state data-color="red">censored</c-state>' +
          "</c-glitch></p>",
      );
    });

    it("leaves other colons and unknown colours as text", async () => {
      expect(await render("==квази-инженеру|Петух: ряженый|pink:x==")).toBe(
        "<p><c-glitch><c-state>квази-инженеру</c-state><c-state>Петух: ряженый</c-state><c-state>pink:x</c-state></c-glitch></p>",
      );
    });

    it("a colour prefix alone is an empty state", async () => {
      expect(await render("==a|teal:==")).toBe("<p>==a|teal:==</p>");
    });

    it("leaves an empty state as literal text", async () => {
      expect(await render("==a|||b==")).toBe("<p>==a|||b==</p>");
      expect(await render("==a| |b==")).toBe("<p>==a| |b==</p>");
      expect(await render("==a|!==")).toBe("<p>==a|!==</p>");
    });
  });

  describe("==D(;)ck pitch== brand", () => {
    it("renders the brand mark", async () => {
      expect(await render("сесть – ==D(;)ck pitch==?")).toBe("<p>сесть – <c-brand></c-brand>?</p>");
    });

    it("is case-insensitive", async () => {
      expect(await render("==D(;)CK PITCH==")).toBe("<p><c-brand></c-brand></p>");
    });

    it("can be a glitch state target only as a plain censor", async () => {
      expect(await render("==что нужно делать.|D(;)ck pitch==")).toBe(
        "<p><c-glitch><c-state>что нужно делать.</c-state><c-state>D<c-censor></c-censor>ck pitch</c-state></c-glitch></p>",
      );
    });
  });

  describe("plain ==highlight==", () => {
    it("renders a mark", async () => {
      expect(await render("это ==важно== тут")).toBe("<p>это <mark>важно</mark> тут</p>");
    });
  });

  describe("things that are not syntax", () => {
    it("ignores === and unpaired ==", async () => {
      expect(await render("a === b and c ==d")).toBe("<p>a === b and c ==d</p>");
    });

    it("ignores == surrounded by spaces", async () => {
      expect(await render("x == y == z")).toBe("<p>x == y == z</p>");
    });

    it("ignores escaped ==", async () => {
      expect(await render("\\==a|b==")).toBe("<p>==a|b==</p>");
    });

    it("leaves code untouched", async () => {
      expect(await render("`==a|b==`")).toBe("<p><code>==a|b==</code></p>");
    });

    it("leaves link URLs untouched", async () => {
      expect(await render("[x](/a==b|c==d)")).toBe('<p><a href="/a==b%7Cc==d">x</a></p>');
    });

    it("keeps text without syntax as is", async () => {
      expect(await render("> Про форточку не забудь!")).toBe(
        "<blockquote>\n<p>Про форточку не забудь!</p>\n</blockquote>",
      );
    });
  });
});
