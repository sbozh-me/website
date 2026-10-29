import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const compileError = vi.hoisted(() => ({ current: null as Error | null }));

vi.mock("@sbozh/pmdxjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sbozh/pmdxjs")>();
  return {
    ...actual,
    compile: (source: string) =>
      compileError.current ? { element: null, error: compileError.current } : actual.compile(source),
  };
});

import InvoicePage, { metadata } from "./page";

describe("InvoicePage", () => {
  afterEach(() => {
    compileError.current = null;
  });

  it("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the invoice with a PDF download", () => {
    const { container } = render(<InvoicePage />);
    expect(screen.getByRole("link", { name: "Stáhnout PDF" })).toHaveAttribute("href", "/api/invoice/pdf");
    expect(container.querySelector(".cv-container")).not.toBeEmptyDOMElement();
  });

  it("shows the compile error", () => {
    compileError.current = new Error("Broken invoice");
    render(<InvoicePage />);
    expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
    expect(screen.getByText("Broken invoice")).toBeInTheDocument();
  });
});
