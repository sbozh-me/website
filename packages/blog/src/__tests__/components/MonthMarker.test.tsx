import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MonthMarker } from "../../components/timeline/MonthMarker";

describe("MonthMarker", () => {
  it("renders month as heading", () => {
    render(<MonthMarker month="January" />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "January",
    );
  });

  it("renders different months", () => {
    const { rerender } = render(<MonthMarker month="March" />);
    expect(screen.getByText("March")).toBeInTheDocument();

    rerender(<MonthMarker month="December" />);
    expect(screen.getByText("December")).toBeInTheDocument();
  });
});
