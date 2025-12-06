import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as pmdxjs from "@sbozh/pmdxjs";
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

  it("renders CV document structure", () => {
    render(<CVPage />);
    expect(document.querySelector(".pmdxjs-document")).toBeInTheDocument();
    expect(document.querySelector(".pmdxjs-page")).toBeInTheDocument();
  });

  describe("error handling", () => {
    beforeEach(() => {
      vi.spyOn(pmdxjs, "compile").mockReturnValue({
        element: null,
        error: new Error("Test compile error"),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders error message when compile fails", () => {
      render(<CVPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Error",
      );
      expect(screen.getByText("Test compile error")).toBeInTheDocument();
    });
  });
});
