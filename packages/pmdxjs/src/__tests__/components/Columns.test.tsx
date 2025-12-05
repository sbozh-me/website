import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Column, Columns } from "../../components/Columns";

describe("Columns", () => {
  it("renders children", () => {
    render(
      <Columns ratio={[60, 40]}>
        <Column>Left</Column>
        <Column>Right</Column>
      </Columns>,
    );

    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByText("Right")).toBeInTheDocument();
  });

  it("applies grid template columns from ratio", () => {
    render(
      <Columns ratio={[60, 40]}>
        <Column>Left</Column>
        <Column>Right</Column>
      </Columns>,
    );

    const columns = document.querySelector(".pmdxjs-columns");
    expect(columns).toHaveStyle({ gridTemplateColumns: "60fr 40fr" });
  });

  it("applies default gap", () => {
    render(
      <Columns ratio={[60, 40]}>
        <Column>Left</Column>
        <Column>Right</Column>
      </Columns>,
    );

    const columns = document.querySelector(".pmdxjs-columns");
    expect(columns).toHaveStyle({ gap: "20px" });
  });

  it("applies custom gap", () => {
    render(
      <Columns ratio={[60, 40]} gap={16}>
        <Column>Left</Column>
        <Column>Right</Column>
      </Columns>,
    );

    const columns = document.querySelector(".pmdxjs-columns");
    expect(columns).toHaveStyle({ gap: "16px" });
  });

  it("applies className", () => {
    render(
      <Columns ratio={[60, 40]} className="custom-class">
        <Column>Left</Column>
      </Columns>,
    );

    const columns = document.querySelector(".pmdxjs-columns");
    expect(columns).toHaveClass("custom-class");
  });
});

describe("Column", () => {
  it("renders children", () => {
    render(
      <Column>
        <div data-testid="child">Content</div>
      </Column>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies className", () => {
    render(<Column className="custom-class">Content</Column>);

    const column = document.querySelector(".pmdxjs-column");
    expect(column).toHaveClass("custom-class");
  });

  it("has min-w-0 class for grid overflow handling", () => {
    render(<Column>Content</Column>);

    const column = document.querySelector(".pmdxjs-column");
    expect(column).toHaveClass("min-w-0");
  });
});
