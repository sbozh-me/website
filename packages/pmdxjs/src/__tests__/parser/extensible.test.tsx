import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createParser } from "../../parser/extensible";
import { transform } from "../../transformer";

describe("createParser", () => {
  it("creates a parser instance", () => {
    const parser = createParser();
    expect(parser).toBeDefined();
    expect(typeof parser.parse).toBe("function");
    expect(typeof parser.extend).toBe("function");
    expect(typeof parser.tokenize).toBe("function");
  });

  it("parses basic source without extensions", () => {
    const parser = createParser();
    const ast = parser.parse(`
:::page
# John Doe
:::page-end
`);

    expect(ast.children).toHaveLength(1);
    expect(ast.children[0].children[0].type).toBe("header");
  });

  it("allows chaining extend calls", () => {
    const parser = createParser()
      .extend({
        name: "button",
        pattern: /^:::button\s+(.+)$/,
        parse: (match) => ({ label: match[1] }),
      })
      .extend({
        name: "link",
        pattern: /^:::link\s+(.+)\s+\|\s+(.+)$/,
        parse: (match) => ({ url: match[1], text: match[2] }),
      });

    const directives = parser.getDirectives();
    expect(directives).toHaveLength(2);
    expect(directives[0].name).toBe("button");
    expect(directives[1].name).toBe("link");
  });
});

describe("extended directives", () => {
  it("parses custom button directive", () => {
    const parser = createParser().extend({
      name: "button",
      pattern: /^:::button\s+(.+)$/,
      parse: (match) => ({ label: match[1] }),
    });

    const ast = parser.parse(`
:::page
# Test

:::button Click Me

:::page-end
`);

    const page = ast.children[0];
    const customNode = page.children.find(
      (n) => (n as Record<string, unknown>).type === "button",
    );

    expect(customNode).toBeDefined();
    expect((customNode as Record<string, unknown>).props).toEqual({
      label: "Click Me",
    });
  });

  it("parses custom directive with multiple params", () => {
    const parser = createParser().extend({
      name: "social",
      pattern: /^:::social\s+(\S+)\s+\|\s+(\S+)$/,
      parse: (match) => ({ github: match[1], linkedin: match[2] }),
    });

    const ast = parser.parse(`
:::page
# Test

:::social johndoe | john-doe

:::page-end
`);

    const page = ast.children[0];
    const customNode = page.children.find(
      (n) => (n as Record<string, unknown>).type === "social",
    );

    expect(customNode).toBeDefined();
    expect((customNode as Record<string, unknown>).props).toEqual({
      github: "johndoe",
      linkedin: "john-doe",
    });
  });
});

describe("transform with custom components", () => {
  it("renders custom button component", () => {
    const parser = createParser().extend({
      name: "button",
      pattern: /^:::button\s+(.+)$/,
      parse: (match) => ({ label: match[1] }),
    });

    const ast = parser.parse(`
:::page
# Test

:::button Print CV

:::page-end
`);

    const CustomButton = ({ label }: { label: string }) => (
      <button data-testid="custom-button">{label}</button>
    );

    const element = transform(ast, {
      components: {
        button: CustomButton,
      },
    });

    render(element);

    expect(screen.getByTestId("custom-button")).toBeInTheDocument();
    expect(screen.getByText("Print CV")).toBeInTheDocument();
  });

  it("renders multiple custom components", () => {
    const parser = createParser()
      .extend({
        name: "button",
        pattern: /^:::button\s+(.+)$/,
        parse: (match) => ({ label: match[1] }),
      })
      .extend({
        name: "badge",
        pattern: /^:::badge\s+(.+)$/,
        parse: (match) => ({ text: match[1] }),
      });

    const ast = parser.parse(`
:::page
# Test

:::button Click Me
:::badge New Feature

:::page-end
`);

    const CustomButton = ({ label }: { label: string }) => (
      <button data-testid="btn">{label}</button>
    );

    const CustomBadge = ({ text }: { text: string }) => (
      <span data-testid="badge">{text}</span>
    );

    const element = transform(ast, {
      components: {
        button: CustomButton,
        badge: CustomBadge,
      },
    });

    render(element);

    expect(screen.getByTestId("btn")).toHaveTextContent("Click Me");
    expect(screen.getByTestId("badge")).toHaveTextContent("New Feature");
  });
});
