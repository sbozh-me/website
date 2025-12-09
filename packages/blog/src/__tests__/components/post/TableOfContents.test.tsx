import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "../../../components/post/TableOfContents";
import type { TOCItem } from "../../../utils";

const mockTOC: TOCItem[] = [
  { id: "introduction", text: "Introduction", level: 2 },
  { id: "getting-started", text: "Getting Started", level: 2 },
  { id: "installation", text: "Installation", level: 3 },
  { id: "configuration", text: "Configuration", level: 3 },
  { id: "conclusion", text: "Conclusion", level: 2 },
];

describe("TableOfContents", () => {

  it("renders all TOC items", () => {
    render(<TableOfContents items={mockTOC} />);

    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Installation")).toBeInTheDocument();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
    expect(screen.getByText("Conclusion")).toBeInTheDocument();
  });

  it("renders TOC title", () => {
    render(<TableOfContents items={mockTOC} />);

    expect(screen.getByText("On this page")).toBeInTheDocument();
  });

  it("renders items as links with correct hrefs", () => {
    render(<TableOfContents items={mockTOC} />);

    const introLink = screen.getByText("Introduction").closest("a");
    expect(introLink).toHaveAttribute("href", "#introduction");

    const configLink = screen.getByText("Configuration").closest("a");
    expect(configLink).toHaveAttribute("href", "#configuration");
  });

  it("applies correct level classes to items", () => {
    const { container } = render(<TableOfContents items={mockTOC} />);

    const level2Items = container.querySelectorAll(".toc-item-2");
    const level3Items = container.querySelectorAll(".toc-item-3");

    expect(level2Items).toHaveLength(3); // Introduction, Getting Started, Conclusion
    expect(level3Items).toHaveLength(2); // Installation, Configuration
  });

  it("renders nav with correct aria-label", () => {
    const { container } = render(<TableOfContents items={mockTOC} />);

    const nav = container.querySelector("nav");
    expect(nav).toHaveAttribute("aria-label", "Table of contents");
  });

  it("handles empty items array", () => {
    const { container } = render(<TableOfContents items={[]} />);

    const list = container.querySelector(".toc-list");
    expect(list?.children).toHaveLength(0);
  });

  it("applies toc class to nav", () => {
    const { container } = render(<TableOfContents items={mockTOC} />);

    const nav = container.querySelector(".toc");
    expect(nav).toBeInTheDocument();
  });
});
