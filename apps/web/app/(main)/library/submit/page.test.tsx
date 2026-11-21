import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./SubmitForm", () => ({
  SubmitForm: () => <div data-testid="submit-form" />,
}));

vi.mock("./SdsCheatSheet", () => ({
  SdsCheatSheet: () => <div data-testid="sds-cheat-sheet" />,
}));

import SubmitPage from "./page";

describe("SubmitPage", () => {
  it("shows the heading, the Library back link, and mounts the form", () => {
    render(<SubmitPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Submit a text" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How it works" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Library/ })).toHaveAttribute(
      "href",
      "/library",
    );
    expect(screen.getByTestId("submit-form")).toBeInTheDocument();
    expect(screen.getByTestId("sds-cheat-sheet")).toBeInTheDocument();
  });
});
