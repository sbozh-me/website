import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "../../../components/cv";

describe("Header", () => {
  it("renders name", () => {
    render(<Header name="John Doe" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<Header name="John Doe" subtitle="Software Engineer" />);
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<Header name="John Doe" />);
    expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument();
  });

  it("renders contact info", () => {
    render(
      <Header
        name="John Doe"
        contact={["john@example.com", "+1-555-0100", "San Francisco"]}
      />,
    );
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("+1-555-0100")).toBeInTheDocument();
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
  });

  it("has correct semantic structure", () => {
    render(<Header name="John Doe" subtitle="Engineer" />);
    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("h1")).toHaveTextContent("John Doe");
  });

  it("applies custom className", () => {
    render(<Header name="John" className="custom-class" />);
    expect(document.querySelector(".custom-class")).toBeInTheDocument();
  });
});
