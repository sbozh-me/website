import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { compile } from "../../runtime/compile";

const doc = (line: string) => `:::page
## Engineering
${line}
:::page-end`;

describe(":::link-qr", () => {
  it("renders a linked QR code with its caption inside the section", () => {
    const { element } = compile(doc(":::link-qr https://sbozh.me/cv | Full CV"));
    render(element!);

    const link = screen.getByRole("link", { name: "Open https://sbozh.me/cv" });
    expect(link).toHaveAttribute("href", "https://sbozh.me/cv");
    expect(link.querySelector("path")?.getAttribute("d")).toMatch(/^M\d+ \d+h1v1h-1z/);
    expect(screen.getByText("Full CV")).toBeInTheDocument();
  });

  it("renders without a caption", () => {
    const { element } = compile(doc(":::link-qr https://sbozh.me/cv"));
    render(element!);

    expect(document.querySelector(".pmdxjs-link-qr .pmdxjs-page-qr")).toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-link-qr-caption")).not.toBeInTheDocument();
  });
});
