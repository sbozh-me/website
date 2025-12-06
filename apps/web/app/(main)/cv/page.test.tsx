import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CVPage from "./page";

describe("CVPage", () => {
  it("renders CV header with name", () => {
    render(<CVPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sem Bozhyk",
    );
  });

  it("renders theme toggle button", () => {
    render(<CVPage />);
    expect(
      screen.getByRole("button", { name: /switch to light mode/i }),
    ).toBeInTheDocument();
  });

  it("renders print button", () => {
    render(<CVPage />);
    expect(
      screen.getByRole("button", { name: /print cv/i }),
    ).toBeInTheDocument();
  });
});
