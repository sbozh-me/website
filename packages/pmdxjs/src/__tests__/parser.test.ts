import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { parse } from "../parser";

import type {
  ColumnsNode,
  EntryNode,
  HeaderNode,
  ListNode,
  SectionNode,
  TagsNode,
} from "../types";

// Helper to read fixture files
function readFixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", `${name}.pmdx`), "utf-8");
}

describe("parse", () => {
  describe("config parsing", () => {
    it("should parse document config", () => {
      const source = `:::config
format: A4
margins: 15 15 15 15
theme: obsidian-forge
:::

:::page
# Test
:::page-end`;

      const ast = parse(source);

      expect(ast.type).toBe("document");
      expect(ast.config.format).toBe("A4");
      expect(ast.config.margins).toEqual([15, 15, 15, 15]);
      expect(ast.config.theme).toBe("obsidian-forge");
    });

    it("should use default config when not specified", () => {
      const source = `:::page
# Test
:::page-end`;

      const ast = parse(source);

      expect(ast.config.format).toBe("A4");
      expect(ast.config.margins).toEqual([20, 20, 20, 20]);
    });

    it("should parse Letter format", () => {
      const source = `:::config
format: Letter
:::

:::page
# Test
:::page-end`;

      const ast = parse(source);
      expect(ast.config.format).toBe("Letter");
    });
  });

  describe("page parsing", () => {
    it("should parse single page", () => {
      const source = `:::page
# Title
:::page-end`;

      const ast = parse(source);

      expect(ast.children).toHaveLength(1);
      expect(ast.children[0].type).toBe("page");
    });

    it("should parse multiple pages", () => {
      const source = `:::page
# Page 1
:::page-end

:::page
# Page 2
:::page-end`;

      const ast = parse(source);

      expect(ast.children).toHaveLength(2);
    });
  });

  describe("header parsing", () => {
    it("should parse header with name only", () => {
      const source = `:::page
# John Doe
:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const header = page.children[0] as HeaderNode;

      expect(header.type).toBe("header");
      expect(header.name).toBe("John Doe");
      expect(header.subtitle).toBeUndefined();
      expect(header.contact).toBeUndefined();
    });

    it("should parse header with subtitle", () => {
      const source = `:::page
# John Doe
subtitle: Software Engineer
:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const header = page.children[0] as HeaderNode;

      expect(header.name).toBe("John Doe");
      expect(header.subtitle).toBe("Software Engineer");
    });

    it("should parse header with contact", () => {
      const source = `:::page
# John Doe
subtitle: Engineer
contact: john@test.com | +1-555-0100 | NYC
:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const header = page.children[0] as HeaderNode;

      expect(header.contact).toEqual(["john@test.com", "+1-555-0100", "NYC"]);
    });
  });

  describe("section parsing", () => {
    it("should parse sections", () => {
      const source = `:::page
# Name

## Experience

Some content here.

## Skills

More content.

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];

      // Should have header + 2 sections
      const sections = page.children.filter(
        (c) => c.type === "section",
      ) as SectionNode[];

      expect(sections).toHaveLength(2);
      expect(sections[0].title).toBe("Experience");
      expect(sections[1].title).toBe("Skills");
    });
  });

  describe("entry parsing", () => {
    it("should parse entry with all fields", () => {
      const source = `:::page
# Name

## Experience

:::entry ACME Corp | Lead Developer | 2020-Present | San Francisco
Led team of engineers.
- Achievement 1
- Achievement 2
:::

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const section = page.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      const entry = section.children[0] as EntryNode;

      expect(entry.type).toBe("entry");
      expect(entry.company).toBe("ACME Corp");
      expect(entry.role).toBe("Lead Developer");
      expect(entry.dates).toBe("2020-Present");
      expect(entry.location).toBe("San Francisco");
      expect(entry.children.length).toBeGreaterThan(0);
    });

    it("should parse entry without location", () => {
      const source = `:::page
# Name

## Work

:::entry Company | Role | 2020-2023
Content
:::

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const section = page.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      const entry = section.children[0] as EntryNode;

      expect(entry.location).toBeUndefined();
    });
  });

  describe("columns parsing", () => {
    it("should parse columns with ratio", () => {
      const source = `:::page
# Name

---columns 60 40

## Left Section

Left content.

---

## Right Section

Right content.

---columns-end

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const columns = page.children.find(
        (c) => c.type === "columns",
      ) as ColumnsNode;

      expect(columns.type).toBe("columns");
      expect(columns.ratio).toEqual([60, 40]);
      expect(columns.children).toHaveLength(2);
      expect(columns.children[0].type).toBe("column");
      expect(columns.children[1].type).toBe("column");
    });

    it("should distribute content to correct columns", () => {
      const source = `:::page
# Name

---columns 70 30

## Experience

Job stuff.

---

## Skills

#tag React

---columns-end

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const columns = page.children.find(
        (c) => c.type === "columns",
      ) as ColumnsNode;

      const leftColumn = columns.children[0];
      const rightColumn = columns.children[1];

      expect(leftColumn.children.length).toBeGreaterThan(0);
      expect(rightColumn.children.length).toBeGreaterThan(0);

      // Left should have Experience section
      const leftSection = leftColumn.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      expect(leftSection?.title).toBe("Experience");

      // Right should have Skills section
      const rightSection = rightColumn.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      expect(rightSection?.title).toBe("Skills");
    });
  });

  describe("tags parsing", () => {
    it("should parse tags into tags node", () => {
      const source = `:::page
# Name

## Skills

#tag TypeScript
#tag React
#tag Node.js

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const section = page.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      const tags = section.children.find((c) => c.type === "tags") as TagsNode;

      expect(tags.type).toBe("tags");
      expect(tags.items).toEqual(["TypeScript", "React", "Node.js"]);
    });
  });

  describe("list parsing", () => {
    it("should parse list items into list node", () => {
      const source = `:::page
# Name

## Achievements

- Built something amazing
- Scaled to 1M users
- Won an award

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const section = page.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      const list = section.children.find((c) => c.type === "list") as ListNode;

      expect(list.type).toBe("list");
      expect(list.ordered).toBe(false);
      expect(list.children).toHaveLength(3);
      expect(list.children[0].type).toBe("listItem");
    });

    it("should parse list items inside entry", () => {
      const source = `:::page
# Name

## Experience

:::entry Company | Role | 2020-Present | Remote
- Achievement one
- Achievement two
:::

:::page-end`;

      const ast = parse(source);
      const page = ast.children[0];
      const section = page.children.find(
        (c) => c.type === "section",
      ) as SectionNode;
      const entry = section.children[0] as EntryNode;
      const list = entry.children.find((c) => c.type === "list") as ListNode;

      expect(list.type).toBe("list");
      expect(list.children).toHaveLength(2);
    });
  });

  describe("fixture files", () => {
    it("should parse basic.pmdx fixture", () => {
      const source = readFixture("basic");
      const ast = parse(source);

      expect(ast.type).toBe("document");
      expect(ast.config.format).toBe("A4");
      expect(ast.config.theme).toBe("obsidian-forge");
      expect(ast.children).toHaveLength(1);

      const page = ast.children[0];
      const header = page.children[0] as HeaderNode;

      expect(header.name).toBe("John Doe");
      expect(header.subtitle).toBe("Senior Software Engineer");
      expect(header.contact).toContain("john@example.com");
    });

    it("should parse minimal.pmdx fixture", () => {
      const source = readFixture("minimal");
      const ast = parse(source);

      expect(ast.type).toBe("document");
      expect(ast.children).toHaveLength(1);

      const page = ast.children[0];
      const header = page.children[0] as HeaderNode;

      expect(header.name).toBe("Jane Smith");
      expect(header.subtitle).toBe("Product Designer");
    });
  });
});
