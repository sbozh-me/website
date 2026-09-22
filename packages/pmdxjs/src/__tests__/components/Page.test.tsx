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
    expect(document.querySelector(".pmdxjs-page-qr-secondary")).not.toBeInTheDocument();
  });

  it("renders a secondary qr code left of the main one, captioned to its left", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [20, 20, 20, 20],
          logo: "/logo.png",
          qr: "https://sbozh.me/cv",
          qrLabel: "Actual web-version",
          qrSize: 3,
          qrPath: "M0 0h1v1h-1z",
          qrSecondary: "https://lnkd.in/p/dKG-q7EC",
          qrSecondaryLabel: "References, unfiltered",
          qrSecondarySize: 3,
          qrSecondaryPath: "M1 1h1v1h-1z",
          version: "v20.26.09",
        }}
      >
        <Page>Content</Page>
      </Document>,
    );

    const corner = document.querySelector(".pmdxjs-page-corner") as HTMLElement;
    expect(corner.style.gridTemplateColumns).toBe("26mm 1fr 26mm");
    // Without a column layout the corner keeps hugging the right margin
    expect(corner.style.left).toBe("");

    const secondary = document.querySelector("a.pmdxjs-page-qr-secondary") as HTMLAnchorElement;
    expect(secondary.getAttribute("href")).toBe("https://lnkd.in/p/dKG-q7EC");
    expect(secondary.style.gridArea).toBe("secondary");
    expect(secondary.querySelector(".pmdxjs-page-qr-code path")?.getAttribute("d")).toBe(
      "M1 1h1v1h-1z",
    );
    expect(secondary.querySelector(".pmdxjs-page-qr-logo")?.getAttribute("src")).toBe("/logo.png");

    const beside = document.querySelector(".pmdxjs-page-qr-label-beside") as HTMLElement;
    expect(beside).toHaveTextContent("References, unfiltered");
    // Shares the code's cell and moves out to its left; the arrow ends the
    // caption, pointing into the code's side
    expect(beside.style.gridArea).toBe("secondary");
    expect(beside.style.transform).toBe("translateX(calc(-100% - 2mm))");
    expect(beside.lastElementChild).toHaveClass("pmdxjs-page-qr-arrow");
    expect(beside.lastElementChild?.getAttribute("width")).toBe("16mm");

    expect(document.querySelectorAll("a.pmdxjs-page-qr")).toHaveLength(2);
    expect(document.querySelectorAll(".pmdxjs-page-qr-arrow")).toHaveLength(2);
  });

  it("uses qr-secondary-logo over the document logo for the secondary code", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [20, 20, 20, 20],
          logo: "/logo.png",
          qr: "https://sbozh.me/cv",
          qrSize: 3,
          qrPath: "M0 0h1v1h-1z",
          qrSecondary: "https://lnkd.in/p/dKG-q7EC",
          qrSecondaryLogo: "/star.svg",
          qrSecondarySize: 3,
          qrSecondaryPath: "M1 1h1v1h-1z",
        }}
      >
        <Page>Content</Page>
      </Document>,
    );

    const [main, secondary] = Array.from(document.querySelectorAll("a.pmdxjs-page-qr"));
    expect(main.querySelector(".pmdxjs-page-qr-logo")?.getAttribute("src")).toBe("/logo.png");
    expect(secondary.querySelector(".pmdxjs-page-qr-logo")?.getAttribute("src")).toBe("/star.svg");
  });

  it("lines the corner up with the last column when the page has columns", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [10, 10, 10, 10],
          qr: "https://sbozh.me/cv",
          qrSize: 3,
          qrPath: "M0 0h1v1h-1z",
          qrSecondary: "https://lnkd.in/p/dKG-q7EC",
          qrSecondarySize: 3,
          qrSecondaryPath: "M1 1h1v1h-1z",
        }}
      >
        <Page columns={[60, 40]}>Content</Page>
      </Document>,
    );

    // 10mm margin + 60% of (190mm content - 20px gap) + 20px gap, at 96px/in
    const px = (mm: number) => (mm * 96) / 25.4;
    const expected = px(10) + (px(190) - 20) * 0.6 + 20;

    const corner = document.querySelector(".pmdxjs-page-corner") as HTMLElement;
    const left = corner.style.left.match(/^calc\(([\d.]+)px\)$/);
    expect(Number(left?.[1])).toBeCloseTo(expected, 2);
    expect(corner.style.right).toBe("10mm");
  });

  it("ignores the column layout without a secondary qr code", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [10, 10, 10, 10],
          qr: "https://sbozh.me/cv",
          qrSize: 3,
          qrPath: "M0 0h1v1h-1z",
        }}
      >
        <Page columns={[60, 40]}>Content</Page>
      </Document>,
    );

    const corner = document.querySelector(".pmdxjs-page-corner") as HTMLElement;
    expect(corner.getAttribute("style")).not.toContain("left:");
  });

  it("renders a secondary qr code without a caption", () => {
    render(
      <Document
        config={{
          format: "A4",
          margins: [20, 20, 20, 20],
          qrSecondary: "https://lnkd.in/p/dKG-q7EC",
          qrSecondarySize: 3,
          qrSecondaryPath: "M1 1h1v1h-1z",
        }}
      >
        <Page>Content</Page>
      </Document>,
    );

    expect(document.querySelector(".pmdxjs-page-corner")).toBeInTheDocument();
    expect(document.querySelector("a.pmdxjs-page-qr-secondary")).toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-page-qr-label")).not.toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-page-qr-logo")).not.toBeInTheDocument();
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
