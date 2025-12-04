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

  it("applies default gap", () => {
    render(
      <Columns ratio={[60, 40]}>
        <Column>Left</Column>
        <Column>Right</Column>
      </Columns>,
    );

    const columns = document.querySelector(".pmdxjs-columns");
    expect(columns).toHaveStyle({ gap: "24px" });
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

  it("applies width style", () => {
    render(<Column width={60}>Content</Column>);

    const column = document.querySelector(".pmdxjs-column");
    expect(column).toHaveStyle({ width: "60%" });
  });

  it("does not apply width when not specified", () => {
    render(<Column>Content</Column>);

    const column = document.querySelector(".pmdxjs-column");
    expect(column).not.toHaveStyle({ width: "60%" });
  });

  it("applies className", () => {
    render(<Column className="custom-class">Content</Column>);

    const column = document.querySelector(".pmdxjs-column");
    expect(column).toHaveClass("custom-class");
  });
});
