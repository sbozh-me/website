import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchPlaceholder } from "../../../components/filters/SearchPlaceholder";

describe("SearchPlaceholder", () => {
  it("renders search text", () => {
    render(<SearchPlaceholder />);

    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("renders search icon", () => {
    const { container } = render(<SearchPlaceholder />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("has cursor-not-allowed class", () => {
    const { container } = render(<SearchPlaceholder />);

    expect(container.firstChild).toHaveClass("cursor-not-allowed");
  });
});
