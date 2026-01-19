import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parse } from "../parser";
import { transform } from "../transformer";

describe("transform", () => {
  it("transforms a simple document", () => {
    const source = `
:::config
format: A4
margins: 20 20 20 20
:::

:::page
# John Doe
subtitle: Software Engineer
:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });

  it("transforms document with columns", () => {
    const source = `
:::page

# Test

---columns 60 40

## Left Section

Left content.

---

## Right Section

Right content.

---columns-end

:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    expect(screen.getByText("Left Section")).toBeInTheDocument();
    expect(screen.getByText("Right Section")).toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-columns")).toBeInTheDocument();
  });

  it("transforms document with entries", () => {
    const source = `
:::page
# Name

## Experience

:::entry ACME Corp | Lead Developer | 2020-Present | San Francisco
Led team of engineers.
:::

:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
    expect(screen.getByText("Lead Developer")).toBeInTheDocument();
    expect(screen.getByText(/2020-Present/)).toBeInTheDocument();
  });

  it("transforms document with tags", () => {
    const source = `
:::page
# Name

## Skills

#tag TypeScript
#tag React
#tag Node.js

:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("applies document config", () => {
    const source = `
:::config
format: Letter
theme: dark
:::

:::page
# Test
:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    const doc = document.querySelector(".pmdxjs-document");
    expect(doc).toHaveAttribute("data-format", "Letter");
    expect(doc).toHaveAttribute("data-theme", "dark");
  });

  it("renders page with correct dimensions", () => {
    const source = `
:::config
format: A4
margins: 15 15 15 15
:::

:::page
# Test
:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    const page = document.querySelector(".pmdxjs-page");
    expect(page).toHaveStyle({ width: "210mm" });
  });

  it("supports custom components via options", () => {
    const source = `
:::page
# Custom Name
:::page-end
`;

    const CustomHeader = ({ name }: { name: string }) => (
      <div data-testid="custom-header">{name}</div>
    );

    const ast = parse(source);
    const element = transform(ast, {
      components: {
        Header: CustomHeader,
      },
    });

    render(element);

    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
    expect(screen.getByText("Custom Name")).toBeInTheDocument();
  });

  it("transforms code block with default component", () => {
    const source = `
:::page
# Title

\`\`\`typescript
const x = 1;
\`\`\`

:::page-end
`;

    const ast = parse(source);
    const element = transform(ast);

    render(element);

    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
    expect(document.querySelector("pre")).toBeInTheDocument();
    expect(document.querySelector("code")).toBeInTheDocument();
  });

  it("transforms code block with custom plugin", () => {
    const source = `
:::page
# Title

\`\`\`mermaid
graph TD
\`\`\`

:::page-end
`;

    const MermaidComponent = ({
      content,
      language,
    }: {
      content: string;
      language: string;
    }) => (
      <div data-testid="mermaid-block" data-language={language}>
        {content}
      </div>
    );

    const mermaidPlugin = {
      languages: ["mermaid", "mmd"],
      component: MermaidComponent,
    };

    const ast = parse(source);
    const element = transform(ast, {
      codeLanguages: [mermaidPlugin],
    });

    render(element);

    const mermaidBlock = screen.getByTestId("mermaid-block");
    expect(mermaidBlock).toBeInTheDocument();
    expect(mermaidBlock).toHaveAttribute("data-language", "mermaid");
    expect(screen.getByText("graph TD")).toBeInTheDocument();
  });

  it("applies plugin transform function", () => {
    const source = `
:::page
# Title

\`\`\`json
  {"key":"value"}
\`\`\`

:::page-end
`;

    const JsonComponent = ({ content }: { content: string }) => (
      <div data-testid="json-block">{content}</div>
    );

    const jsonPlugin = {
      languages: ["json"],
      component: JsonComponent,
      transform: (content: string) => content.trim(),
    };

    const ast = parse(source);
    const element = transform(ast, {
      codeLanguages: [jsonPlugin],
    });

    render(element);

    const jsonBlock = screen.getByTestId("json-block");
    expect(jsonBlock.textContent).toBe('{"key":"value"}');
  });

  it("uses default component when no plugin matches", () => {
    const source = `
:::page
# Title

\`\`\`python
print("hello")
\`\`\`

:::page-end
`;

    const mermaidPlugin = {
      languages: ["mermaid"],
      component: () => <div data-testid="mermaid">Mermaid</div>,
    };

    const ast = parse(source);
    const element = transform(ast, {
      codeLanguages: [mermaidPlugin],
    });

    render(element);

    // Should NOT use mermaid plugin
    expect(screen.queryByTestId("mermaid")).not.toBeInTheDocument();
    // Should use default pre/code
    expect(screen.getByText('print("hello")')).toBeInTheDocument();
    expect(document.querySelector("pre")).toBeInTheDocument();
  });

  it("respects plugin priority order", () => {
    const source = `
:::page
# Title

\`\`\`typescript
const x = 1;
\`\`\`

:::page-end
`;

    const FirstPlugin = {
      languages: ["typescript"],
      component: () => <div data-testid="first">First Plugin</div>,
    };

    const SecondPlugin = {
      languages: ["typescript", "ts"],
      component: () => <div data-testid="second">Second Plugin</div>,
    };

    const ast = parse(source);
    const element = transform(ast, {
      codeLanguages: [FirstPlugin, SecondPlugin],
    });

    render(element);

    // First plugin should win
    expect(screen.getByTestId("first")).toBeInTheDocument();
    expect(screen.queryByTestId("second")).not.toBeInTheDocument();
  });
});
