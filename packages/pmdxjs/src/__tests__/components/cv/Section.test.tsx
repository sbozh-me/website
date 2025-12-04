import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Section } from "../../../components/cv";

describe("Section", () => {
  it("renders title", () => {
    render(<Section title="Experience">Content</Section>);
    expect(screen.getByText("Experience")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(<Section title="Skills">My skills content</Section>);
    expect(screen.getByText("My skills content")).toBeInTheDocument();
  });

  it("has correct semantic structure", () => {
    render(<Section title="Education">Content</Section>);
    expect(document.querySelector("section")).toBeInTheDocument();
    expect(document.querySelector("h2")).toHaveTextContent("Education");
  });

  it("applies custom className", () => {
    render(
      <Section title="Test" className="custom-section">
        Content
      </Section>,
    );
    expect(document.querySelector(".custom-section")).toBeInTheDocument();
  });
});
