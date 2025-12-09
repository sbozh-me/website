import { describe, expect, it } from "vitest";
import { extractHeadings } from "../../utils/toc";

describe("extractHeadings", () => {
  it("extracts h2 headings from markdown", () => {
    const markdown = `
# Title

Some intro text.

## First Section

Content here.

## Second Section

More content.
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "first-section",
      text: "First Section",
      level: 2,
    });
    expect(result[1]).toEqual({
      id: "second-section",
      text: "Second Section",
      level: 2,
    });
  });

  it("extracts h3 headings from markdown", () => {
    const markdown = `
## Main Section

### Subsection One

Content.

### Subsection Two

More content.
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: "main-section",
      text: "Main Section",
      level: 2,
    });
    expect(result[1]).toEqual({
      id: "subsection-one",
      text: "Subsection One",
      level: 3,
    });
    expect(result[2]).toEqual({
      id: "subsection-two",
      text: "Subsection Two",
      level: 3,
    });
  });

  it("ignores h1 and h4+ headings", () => {
    const markdown = `
# H1 Title

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("H2 Heading");
    expect(result[1].text).toBe("H3 Heading");
  });

  it("handles headings with special characters", () => {
    const markdown = `
## Why I started sbozh.me

### The First Commit (2025)

## Questions & Answers
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: "why-i-started-sbozhme",
      text: "Why I started sbozh.me",
      level: 2,
    });
    expect(result[1]).toEqual({
      id: "the-first-commit-2025",
      text: "The First Commit (2025)",
      level: 3,
    });
    expect(result[2]).toEqual({
      id: "questions--answers",
      text: "Questions & Answers",
      level: 2,
    });
  });

  it("returns empty array for markdown without h2/h3", () => {
    const markdown = `
# Just a title

Some paragraph text.

#### H4 Heading
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toEqual([]);
  });

  it("handles duplicate heading text with unique IDs", () => {
    const markdown = `
## Introduction

Some content.

## Introduction

Different content.
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("introduction");
    expect(result[1].id).toBe("introduction-1");
  });

  it("trims whitespace from heading text", () => {
    const markdown = `
##   Heading with spaces

###    Another one
    `.trim();

    const result = extractHeadings(markdown);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Heading with spaces");
    expect(result[1].text).toBe("Another one");
  });
});
