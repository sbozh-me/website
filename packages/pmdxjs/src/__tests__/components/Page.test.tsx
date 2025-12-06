import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Document } from "../../components/Document";
import { Page } from "../../components/Page";

describe("Page", () => {
  it("renders children", () => {
    render(
      <Document>
        <Page>
          <div data-testid="child">Content</div>
        </Page>
      </Document>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies A4 dimensions from context", () => {
    render(
      <Document config={{ format: "A4", margins: [20, 20, 20, 20] }}>
        <Page>Content</Page>
      </Document>,
    );

    const page = document.querySelector(".pmdxjs-page");
    expect(page).toHaveStyle({ width: "210mm", height: "297mm" });
  });

  it("applies Letter dimensions from context", () => {
    render(
      <Document config={{ format: "Letter", margins: [20, 20, 20, 20] }}>
        <Page>Content</Page>
      </Document>,
    );

    const page = document.querySelector(".pmdxjs-page");
    expect(page).toHaveStyle({ width: "215.9mm", height: "279.4mm" });
  });

  it("applies margins from context", () => {
    render(
      <Document config={{ format: "A4", margins: [15, 20, 25, 30] }}>
        <Page>Content</Page>
      </Document>,
    );

    const page = document.querySelector(".pmdxjs-page");
    expect(page).toHaveStyle({
      padding: "15mm 20mm 25mm 30mm",
    });
  });

  it("applies className", () => {
    render(
      <Document>
        <Page className="custom-class">Content</Page>
      </Document>,
    );

    const page = document.querySelector(".pmdxjs-page");
    expect(page).toHaveClass("custom-class");
  });
});
