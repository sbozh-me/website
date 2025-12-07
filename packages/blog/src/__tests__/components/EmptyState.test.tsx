import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "../../components/timeline/EmptyState";

describe("EmptyState", () => {
  it("renders default message", () => {
    render(<EmptyState />);

    expect(screen.getByText("No posts found")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<EmptyState message="No matching articles" />);

    expect(screen.getByText("No matching articles")).toBeInTheDocument();
  });
});
