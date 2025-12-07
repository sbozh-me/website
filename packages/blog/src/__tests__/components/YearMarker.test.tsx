import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { YearMarker } from "../../components/timeline/YearMarker";

describe("YearMarker", () => {
  it("renders year as heading", () => {
    render(<YearMarker year={2024} />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("2024");
  });

  it("renders different years", () => {
    const { rerender } = render(<YearMarker year={2023} />);
    expect(screen.getByText("2023")).toBeInTheDocument();

    rerender(<YearMarker year={2025} />);
    expect(screen.getByText("2025")).toBeInTheDocument();
  });
});
