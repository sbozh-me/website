import { describe, expect, it } from "vitest";

import { lineAt, lineRange, link, prefixLines, voice, wrap, type Edit } from "./markdown-edit";

const run = (text: string, edit: Edit) => {
  const next = text.slice(0, edit.from) + edit.insert + text.slice(edit.to);
  return { selected: next.slice(edit.select.start, edit.select.end), text: next };
};

describe("markdown edits", () => {
  it("wraps the selection and toggles it back", () => {
    const text = "say hello now";
    const bold = run(text, wrap(text, { end: 9, start: 4 }, "**", "**", "bold"));
    expect(bold).toEqual({ selected: "hello", text: "say **hello** now" });

    const again = run(bold.text, wrap(bold.text, { end: 11, start: 6 }, "**", "**", "bold"));
    expect(again).toEqual({ selected: "hello", text });
  });

  it("inserts a selected placeholder when nothing is selected", () => {
    expect(run("a ", wrap("a ", { end: 2, start: 2 }, "==", "|meaning==", "word"))).toEqual({
      selected: "word",
      text: "a ==word|meaning==",
    });
  });

  it("prefixes every touched line, switches markers, and toggles off", () => {
    const text = "one\ntwo\nthree";
    const quoted = run(text, prefixLines(text, { end: 5, start: 1 }, "> "));
    expect(quoted.text).toBe("> one\n> two\nthree");

    expect(run(quoted.text, prefixLines(quoted.text, { end: 3, start: 3 }, "## ")).text).toBe("## one\n> two\nthree");
    expect(run(quoted.text, prefixLines(quoted.text, { end: 9, start: 0 }, "> ")).text).toBe(text);
  });

  it("finds whole lines, ignoring a selection that ends right after a newline", () => {
    expect(lineRange("ab\ncd\nef", { end: 4, start: 4 })).toEqual({ end: 5, start: 3 });
    expect(lineRange("ab\ncd\nef", { end: 3, start: 0 })).toEqual({ end: 2, start: 0 });
  });

  it("makes a link with the URL selected", () => {
    expect(run("go here", link("go here", { end: 7, start: 3 }))).toEqual({
      selected: "https://",
      text: "go [here](https://)",
    });
  });

  it("puts a Voice block around the lines, or a fresh one on an empty line", () => {
    expect(run("— Ave.", voice("— Ave.", { end: 2, start: 2 })).text).toBe('<Voice color="teal">\n\n— Ave.\n\n</Voice>');
    expect(run("a\n\n", voice("a\n\n", { end: 2, start: 2 }))).toEqual({
      selected: "— Their lines.",
      text: 'a\n<Voice color="teal">\n\n— Their lines.\n\n</Voice>\n',
    });
  });

  it("counts lines up to an offset", () => {
    expect(lineAt("a\nb\nc", 0)).toBe(1);
    expect(lineAt("a\nb\nc", 4)).toBe(3);
  });
});
