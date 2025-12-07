import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PersonaDot } from "../../components/timeline/PersonaDot";

describe("PersonaDot", () => {
  it("renders dot with correct color", () => {
    const { container } = render(
      <PersonaDot color="#3b82f6" name="Developer" />,
    );

    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toHaveStyle({ backgroundColor: "#3b82f6" });
  });

  it("does not show name by default", () => {
    render(<PersonaDot color="#3b82f6" name="Developer" />);

    expect(screen.queryByText("Developer")).not.toBeInTheDocument();
  });

  it("shows name when showName is true", () => {
    render(<PersonaDot color="#3b82f6" name="Developer" showName />);

    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("applies color to name text when shown", () => {
    render(<PersonaDot color="#10b981" name="Tester" showName />);

    const nameElement = screen.getByText("Tester");
    expect(nameElement).toHaveStyle({ color: "#10b981" });
  });
});
