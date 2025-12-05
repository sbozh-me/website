import { describe, expect, it } from "vitest";

import { parseInline } from "../../parser/inline";

describe("parseInline", () => {
  it("parses plain text", () => {
    const result = parseInline("Hello world");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "text", value: "Hello world" });
  });

  it("parses bold text with **", () => {
    const result = parseInline("This is **bold** text");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "text", value: "This is " });
    expect(result[1]).toEqual({
      type: "strong",
      children: [{ type: "text", value: "bold" }],
    });
    expect(result[2]).toEqual({ type: "text", value: " text" });
  });

  it("parses bold text with __", () => {
    const result = parseInline("This is __bold__ text");
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      type: "strong",
      children: [{ type: "text", value: "bold" }],
    });
  });

  it("parses italic text with *", () => {
    const result = parseInline("This is *italic* text");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "text", value: "This is " });
    expect(result[1]).toEqual({
      type: "emphasis",
      children: [{ type: "text", value: "italic" }],
    });
    expect(result[2]).toEqual({ type: "text", value: " text" });
  });

  it("parses italic text with _", () => {
    const result = parseInline("This is _italic_ text");
    expect(result).toHaveLength(3);
    expect(result[1]).toEqual({
      type: "emphasis",
      children: [{ type: "text", value: "italic" }],
    });
  });

  it("parses links", () => {
    const result = parseInline("Check out [this link](https://example.com)!");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "text", value: "Check out " });
    expect(result[1]).toEqual({
      type: "link",
      url: "https://example.com",
      children: [{ type: "text", value: "this link" }],
    });
    expect(result[2]).toEqual({ type: "text", value: "!" });
  });

  it("parses nested bold and italic", () => {
    const result = parseInline("**bold and *italic* text**");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("strong");
    const strongNode = result[0] as { type: "strong"; children: unknown[] };
    expect(strongNode.children).toHaveLength(3);
  });

  it("parses multiple formatting in sequence", () => {
    const result = parseInline("**bold** and *italic*");
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe("strong");
    expect(result[1]).toEqual({ type: "text", value: " and " });
    expect(result[2].type).toBe("emphasis");
  });

  it("handles unmatched asterisks as plain text", () => {
    const result = parseInline("5 * 3 = 15");
    // Should not be parsed as italic, just plain text
    expect(result.every((node) => node.type === "text")).toBe(true);
  });

  it("parses list item with bold", () => {
    const result = parseInline("Built **Playwright** test framework");
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "text", value: "Built " });
    expect(result[1]).toEqual({
      type: "strong",
      children: [{ type: "text", value: "Playwright" }],
    });
    expect(result[2]).toEqual({ type: "text", value: " test framework" });
  });
});
