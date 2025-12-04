import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Languages } from "../../../components/cv";

describe("Languages", () => {
  it("renders all language items", () => {
    render(
      <Languages
        items={[
          { language: "English", level: "Native" },
          { language: "German", level: "Fluent" },
        ]}
      />,
    );
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Native")).toBeInTheDocument();
    expect(screen.getByText("German")).toBeInTheDocument();
    expect(screen.getByText("Fluent")).toBeInTheDocument();
  });

  it("renders empty when no items", () => {
    render(<Languages items={[]} />);
    expect(document.querySelector(".pmdxjs-languages")).toBeInTheDocument();
  });

  it("has pmdxjs-languages class", () => {
    render(<Languages items={[{ language: "English", level: "Native" }]} />);
    expect(document.querySelector(".pmdxjs-languages")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Languages
        items={[{ language: "English", level: "Native" }]}
        className="custom-languages"
      />,
    );
    expect(document.querySelector(".custom-languages")).toBeInTheDocument();
  });
});
