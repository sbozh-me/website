import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Document } from "../../components/Document";

describe("Document", () => {
  it("renders children", () => {
    render(
      <Document>
        <div data-testid="child">Content</div>
      </Document>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies default config", () => {
    render(
      <Document>
        <div>Content</div>
      </Document>,
    );

    const doc = document.querySelector(".pmdxjs-document");
    expect(doc).toHaveAttribute("data-format", "A4");
  });

  it("applies custom config", () => {
    render(
      <Document config={{ format: "Letter", theme: "dark" }}>
        <div>Content</div>
      </Document>,
    );

    const doc = document.querySelector(".pmdxjs-document");
    expect(doc).toHaveAttribute("data-format", "Letter");
    expect(doc).toHaveAttribute("data-theme", "dark");
  });

  it("applies className", () => {
    render(
      <Document className="custom-class">
        <div>Content</div>
      </Document>,
    );

    const doc = document.querySelector(".pmdxjs-document");
    expect(doc).toHaveClass("custom-class");
  });
});
