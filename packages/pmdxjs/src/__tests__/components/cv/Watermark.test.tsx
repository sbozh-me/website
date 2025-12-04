import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Watermark } from "../../../components/cv";

describe("Watermark", () => {
  it("renders default text", () => {
    render(<Watermark />);
    expect(screen.getByText("Generated with PMDXJS")).toBeInTheDocument();
  });

  it("renders custom text", () => {
    render(<Watermark text="Custom watermark" />);
    expect(screen.getByText("Custom watermark")).toBeInTheDocument();
  });

  it("has pmdxjs-watermark class", () => {
    render(<Watermark />);
    expect(document.querySelector(".pmdxjs-watermark")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Watermark className="custom-watermark" />);
    expect(document.querySelector(".custom-watermark")).toBeInTheDocument();
  });
});
