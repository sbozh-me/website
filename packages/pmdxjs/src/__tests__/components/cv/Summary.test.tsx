import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Summary } from "../../../components/cv";

describe("Summary", () => {
  it("renders children content", () => {
    render(<Summary>Professional summary text here.</Summary>);
    expect(
      screen.getByText("Professional summary text here."),
    ).toBeInTheDocument();
  });

  it("has pmdxjs-summary class", () => {
    render(<Summary>Content</Summary>);
    expect(document.querySelector(".pmdxjs-summary")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Summary className="custom-summary">Content</Summary>);
    expect(document.querySelector(".custom-summary")).toBeInTheDocument();
  });
});
