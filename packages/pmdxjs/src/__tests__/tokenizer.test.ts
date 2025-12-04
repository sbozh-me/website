import { describe, expect, it } from "vitest";

import { tokenize, tokenizeLine } from "../parser/tokenizer";

describe("tokenizeLine", () => {
  const defaultContext = { inConfig: false, inEntry: false };

  it("should tokenize config start", () => {
    const token = tokenizeLine(":::config", 1, defaultContext);
    expect(token).toEqual({
      type: "config_start",
      value: ":::config",
      line: 1,
      column: 1,
    });
  });

  it("should tokenize block end as config_end when in config", () => {
    const token = tokenizeLine(":::", 5, { inConfig: true, inEntry: false });
    expect(token?.type).toBe("config_end");
  });

  it("should tokenize block end as entry_end when in entry", () => {
    const token = tokenizeLine(":::", 10, { inConfig: false, inEntry: true });
    expect(token?.type).toBe("entry_end");
  });

  it("should tokenize page start", () => {
    const token = tokenizeLine(":::page", 1, defaultContext);
    expect(token?.type).toBe("page_start");
  });

  it("should tokenize page end", () => {
    const token = tokenizeLine(":::page-end", 1, defaultContext);
    expect(token?.type).toBe("page_end");
  });

  it("should tokenize entry start with metadata", () => {
    const token = tokenizeLine(
      ":::entry ACME Corp | Lead Developer | 2020-Present | SF",
      1,
      defaultContext,
    );
    expect(token?.type).toBe("entry_start");
    expect(token?.meta).toEqual({
      company: "ACME Corp",
      role: "Lead Developer",
      dates: "2020-Present",
      location: "SF",
    });
  });

  it("should tokenize entry start without location", () => {
    const token = tokenizeLine(
      ":::entry Company | Role | 2020-2023",
      1,
      defaultContext,
    );
    expect(token?.meta).toEqual({
      company: "Company",
      role: "Role",
      dates: "2020-2023",
      location: undefined,
    });
  });

  it("should tokenize columns start with ratio", () => {
    const token = tokenizeLine("---columns 60 40", 1, defaultContext);
    expect(token?.type).toBe("columns_start");
    expect(token?.meta).toEqual({ left: 60, right: 40 });
  });

  it("should tokenize columns end", () => {
    const token = tokenizeLine("---columns-end", 1, defaultContext);
    expect(token?.type).toBe("columns_end");
  });

  it("should tokenize tag", () => {
    const token = tokenizeLine("#tag TypeScript", 1, defaultContext);
    expect(token?.type).toBe("tag");
    expect(token?.value).toBe("TypeScript");
  });

  it("should tokenize tag with spaces", () => {
    const token = tokenizeLine("#tag LEAN Manufacturing", 1, defaultContext);
    expect(token?.value).toBe("LEAN Manufacturing");
  });

  it("should tokenize h1 heading", () => {
    const token = tokenizeLine("# John Doe", 1, defaultContext);
    expect(token?.type).toBe("heading");
    expect(token?.value).toBe("John Doe");
    expect(token?.meta?.level).toBe(1);
  });

  it("should tokenize h2 heading", () => {
    const token = tokenizeLine("## Experience", 1, defaultContext);
    expect(token?.type).toBe("heading");
    expect(token?.value).toBe("Experience");
    expect(token?.meta?.level).toBe(2);
  });

  it("should tokenize divider", () => {
    const token = tokenizeLine("---", 1, defaultContext);
    expect(token?.type).toBe("divider");
  });

  it("should tokenize metadata", () => {
    const token = tokenizeLine(
      "subtitle: Software Engineer",
      1,
      defaultContext,
    );
    expect(token?.type).toBe("metadata");
    expect(token?.meta?.key).toBe("subtitle");
    expect(token?.value).toBe("Software Engineer");
  });

  it("should tokenize contact metadata as array", () => {
    const token = tokenizeLine(
      "contact: email@test.com | +1-555-0100 | NYC",
      1,
      defaultContext,
    );
    expect(token?.type).toBe("metadata");
    expect(token?.meta?.key).toBe("contact");
    expect(token?.meta?.parsedValue).toEqual([
      "email@test.com",
      "+1-555-0100",
      "NYC",
    ]);
  });

  it("should return null for empty lines", () => {
    const token = tokenizeLine("", 1, defaultContext);
    expect(token).toBeNull();
  });

  it("should tokenize plain text", () => {
    const token = tokenizeLine("Some regular text content", 1, defaultContext);
    expect(token?.type).toBe("text");
    expect(token?.value).toBe("Some regular text content");
  });
});

describe("tokenize", () => {
  it("should tokenize a complete document", () => {
    const source = `:::config
format: A4
:::

:::page
# John Doe
subtitle: Engineer
:::page-end`;

    const tokens = tokenize(source);

    expect(tokens.map((t) => t.type)).toEqual([
      "config_start",
      "metadata",
      "config_end",
      "page_start",
      "heading",
      "metadata",
      "page_end",
    ]);
  });

  it("should handle entries correctly", () => {
    const source = `:::entry Company | Role | 2020-2023
- Did something
- Did another thing
:::`;

    const tokens = tokenize(source);

    expect(tokens[0].type).toBe("entry_start");
    expect(tokens[tokens.length - 1].type).toBe("entry_end");
  });

  it("should handle columns correctly", () => {
    const source = `---columns 70 30
## Left
---
## Right
---columns-end`;

    const tokens = tokenize(source);

    expect(tokens.map((t) => t.type)).toEqual([
      "columns_start",
      "heading",
      "divider",
      "heading",
      "columns_end",
    ]);
  });

  it("should collect multiple tags", () => {
    const source = `#tag React
#tag TypeScript
#tag Node.js`;

    const tokens = tokenize(source);

    expect(tokens.every((t) => t.type === "tag")).toBe(true);
    expect(tokens.map((t) => t.value)).toEqual([
      "React",
      "TypeScript",
      "Node.js",
    ]);
  });
});
