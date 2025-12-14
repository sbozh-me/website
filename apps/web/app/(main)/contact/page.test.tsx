import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContactPage from "./page";

describe("ContactPage", () => {
  it("renders contact heading", () => {
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Contact"
    );
  });

  it("renders under construction message", () => {
    render(<ContactPage />);
    expect(screen.getByText(/Under construction/)).toBeInTheDocument();
  });

  it("renders Discord link", () => {
    render(<ContactPage />);
    const discordLink = screen.getByRole("link", { name: /Discord/i });
    expect(discordLink).toBeInTheDocument();
    expect(discordLink).toHaveAttribute("href", "/projects/discord-community");
  });

  it("renders email link", () => {
    render(<ContactPage />);
    const emailLink = screen.getByText("sem.bozhyk@sbozh.me");
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:sem.bozhyk@sbozh.me");
  });

  it("has correct page structure", () => {
    render(<ContactPage />);
    const container = screen.getByRole("heading", { level: 1 }).closest("div");
    expect(container).toHaveClass("max-w-3xl", "mx-auto");
  });
});