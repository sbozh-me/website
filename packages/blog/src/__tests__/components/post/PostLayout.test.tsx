import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PostLayout } from "../../../components/post/PostLayout";
import type { TOCItem } from "../../../utils";

const mockTOC: TOCItem[] = [
  { id: "section-1", text: "Section 1", level: 2 },
  { id: "section-2", text: "Section 2", level: 2 },
  { id: "subsection", text: "Subsection", level: 3 },
];

describe("PostLayout", () => {
  it("renders children content", () => {
    render(
      <PostLayout>
        <div>Main content</div>
      </PostLayout>
    );

    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("renders table of contents when toc provided", () => {
    render(
      <PostLayout toc={mockTOC}>
        <div>Content</div>
      </PostLayout>
    );

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getByText("Subsection")).toBeInTheDocument();
  });

  it("does not render table of contents when toc not provided", () => {
    render(
      <PostLayout>
        <div>Content</div>
      </PostLayout>
    );

    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
  });

  it("does not render table of contents when toc is empty", () => {
    render(
      <PostLayout toc={[]}>
        <div>Content</div>
      </PostLayout>
    );

    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
  });

  it("wraps content in article element", () => {
    const { container } = render(
      <PostLayout>
        <div>Content</div>
      </PostLayout>
    );

    const article = container.querySelector("article");
    expect(article).toBeInTheDocument();
    expect(article?.textContent).toBe("Content");
  });

  it("wraps TOC in aside element", () => {
    const { container } = render(
      <PostLayout toc={mockTOC}>
        <div>Content</div>
      </PostLayout>
    );

    const aside = container.querySelector("aside");
    expect(aside).toBeInTheDocument();
  });
});
