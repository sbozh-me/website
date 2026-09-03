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

  it("renders the config logo in the bottom-right corner", () => {
    render(
      <Document config={{ format: "A4", margins: [15, 20, 25, 30], logo: "/logo.png" }}>
        <Page>Content</Page>
      </Document>,
    );

    const corner = document.querySelector(".pmdxjs-page-corner");
    expect(corner).toHaveStyle({ position: "absolute", right: "20mm", bottom: "25mm" });
    const logo = document.querySelector(".pmdxjs-page-logo") as HTMLImageElement;
    expect(logo).toBeInTheDocument();
    expect(logo.getAttribute("src")).toBe("/logo.png");
    expect(document.querySelector(".pmdxjs-page-qr")).not.toBeInTheDocument();
  });

  it("renders a qr code with label and centred logo", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [20, 20, 20, 20],
          logo: "/logo.png",
          qr: "https://sbozh.me/cv",
          qrLabel: "Actual web-version",
          qrSize: 3,
          qrPath: "M0 0h1v1h-1zM2 2h1v1h-1z",
          version: "v20.26.09",
        }}
      >
        <Page>Content</Page>
      </Document>,
    );

    const link = document.querySelector("a.pmdxjs-page-qr") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("https://sbozh.me/cv");
    expect(document.querySelector(".pmdxjs-page-qr-code path")?.getAttribute("d")).toBe(
      "M0 0h1v1h-1zM2 2h1v1h-1z",
    );
    expect(document.querySelector(".pmdxjs-page-qr-label-text")).toHaveTextContent("Actual web-version");
    expect(document.querySelector(".pmdxjs-page-qr-arrow")).toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-page-qr-logo")?.getAttribute("src")).toBe("/logo.png");
    expect(document.querySelector(".pmdxjs-page-logo")).not.toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-page-version")).toHaveTextContent("v20.26.09");
  });

  it("renders no logo without config.logo", () => {
    render(
      <Document>
        <Page>Content</Page>
      </Document>,
    );

    expect(document.querySelector(".pmdxjs-page-corner")).not.toBeInTheDocument();
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
