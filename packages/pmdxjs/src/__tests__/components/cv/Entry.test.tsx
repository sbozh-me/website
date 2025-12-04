import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Entry } from "../../../components/cv";

describe("Entry", () => {
  it("renders company name", () => {
    render(<Entry company="ACME Corp" role="Developer" dates="2020-Present" />);
    expect(screen.getByText("ACME Corp")).toBeInTheDocument();
  });

  it("renders role", () => {
    render(<Entry company="ACME Corp" role="Lead Developer" dates="2020" />);
    expect(screen.getByText("Lead Developer")).toBeInTheDocument();
  });

  it("renders dates", () => {
    render(<Entry company="Company" role="Role" dates="Jan 2020 - Dec 2023" />);
    expect(screen.getByText("Jan 2020 - Dec 2023")).toBeInTheDocument();
  });

  it("renders location when provided", () => {
    render(
      <Entry
        company="Company"
        role="Role"
        dates="2020"
        location="San Francisco"
      />,
    );
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <Entry company="Company" role="Role" dates="2020">
        <p>Led team of engineers</p>
      </Entry>,
    );
    expect(screen.getByText("Led team of engineers")).toBeInTheDocument();
  });

  it("has article element for semantic structure", () => {
    render(<Entry company="Company" role="Role" dates="2020" />);
    expect(document.querySelector("article")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Entry
        company="Company"
        role="Role"
        dates="2020"
        className="custom-entry"
      />,
    );
    expect(document.querySelector(".custom-entry")).toBeInTheDocument();
  });
});
