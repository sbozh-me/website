import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ForumPage, { metadata } from "./page";

describe("ForumPage", () => {
  it("renders the Forum heading and TBD placeholder", () => {
    render(<ForumPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Forum");
    expect(screen.getByText("TBD")).toBeInTheDocument();
  });

  it("exports metadata that keeps the page out of the index", () => {
    expect(metadata.title).toBe("Forum");
    expect(metadata.description).toBe("The Forum is on pause.");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
