import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SemenCVPage from "./page";

describe("SemenCVPage", () => {
  it("renders the Semen Bozhyk CV, not the Sem one", () => {
    render(<SemenCVPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Semen Bozhyk",
    );
  });

  it("draws the persona's avatar on the page", () => {
    render(<SemenCVPage />);
    expect(document.querySelector(".pmdxjs-page-photo")).toHaveAttribute(
      "src",
      "/semen_bozhyk.png",
    );
  });

});
