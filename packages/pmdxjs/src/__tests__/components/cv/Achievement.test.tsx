import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Achievement } from "../../../components/cv";

describe("Achievement", () => {
  it("renders achievement text", () => {
    render(<Achievement>Led team of 5 engineers</Achievement>);
    expect(screen.getByText("Led team of 5 engineers")).toBeInTheDocument();
  });

  it("renders as list item", () => {
    render(<Achievement>Achievement text</Achievement>);
    expect(document.querySelector("li")).toBeInTheDocument();
  });

  it("has pmdxjs-achievement class", () => {
    render(<Achievement>Text</Achievement>);
    expect(document.querySelector(".pmdxjs-achievement")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Achievement className="custom-achievement">Text</Achievement>);
    expect(document.querySelector(".custom-achievement")).toBeInTheDocument();
  });
});
