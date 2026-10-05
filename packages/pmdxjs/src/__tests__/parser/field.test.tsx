import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parse } from "../../parser";
import { compile } from "../../runtime/compile";

import type { FieldNode, SectionNode } from "../../types/ast";

const SOURCE = `:::page

:::field Jméno a příjmení, datum narození, bydliště

:::field název obce, ulice, PSČ | Semen Bozhyk

:::page-end
`;

function fields(): FieldNode[] {
  const page = parse(SOURCE).children[0];
  return page.children.filter((n): n is FieldNode => n.type === "field");
}

describe(":::field directive", () => {
  it("parses a blank field with only a caption", () => {
    const [blank] = fields();
    expect(blank.caption).toBe("Jméno a příjmení, datum narození, bydliště");
    expect(blank.value).toBeUndefined();
  });

  it("parses a pre-filled value after the pipe", () => {
    const [, filled] = fields();
    expect(filled.caption).toBe("název obce, ulice, PSČ");
    expect(filled.value).toBe("Semen Bozhyk");
  });

  it("renders the caption in parentheses and the value on the line", () => {
    const { element, error } = compile(SOURCE);
    expect(error).toBeNull();
    const { container } = render(<>{element}</>);

    const rendered = container.querySelectorAll(".pmdxjs-field");
    expect(rendered).toHaveLength(2);
    expect(rendered[0].querySelector(".pmdxjs-field-value")).toBeNull();
    expect(rendered[0].textContent).toContain(
      "(Jméno a příjmení, datum narození, bydliště)",
    );
    expect(
      rendered[1].querySelector(".pmdxjs-field-value")?.textContent,
    ).toBe("Semen Bozhyk");
  });
});

describe("section heading followed by columns", () => {
  it("keeps the heading as an empty section before the columns", () => {
    const page = parse(`:::page

## Vlastník nemovitosti

---columns 60 40

:::field jméno a příjmení

---

:::field datum narození

---columns-end

:::page-end
`).children[0];

    expect(page.children.map((n) => n.type)).toEqual(["section", "columns"]);
    const section = page.children[0] as SectionNode;
    expect(section.title).toBe("Vlastník nemovitosti");
    expect(section.children).toEqual([]);
  });
});
