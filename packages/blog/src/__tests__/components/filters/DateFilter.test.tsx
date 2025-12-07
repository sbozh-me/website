import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DateFilter } from "../../../components/filters/DateFilter";

describe("DateFilter", () => {
  it("renders with 'All time' placeholder", () => {
    render(<DateFilter onChange={() => {}} />);

    expect(screen.getByRole("combobox")).toHaveDisplayValue("All time");
  });

  it("renders current year as default option", () => {
    render(<DateFilter onChange={() => {}} />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(String(currentYear))).toBeInTheDocument();
  });

  it("renders provided available years", () => {
    render(
      <DateFilter onChange={() => {}} availableYears={[2025, 2024, 2023]} />,
    );

    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("displays selected year", () => {
    render(
      <DateFilter value={2024} onChange={() => {}} availableYears={[2024]} />,
    );

    expect(screen.getByRole("combobox")).toHaveDisplayValue("2024");
  });

  it("calls onChange with year number when selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DateFilter onChange={onChange} availableYears={[2024]} />);

    await user.selectOptions(screen.getByRole("combobox"), "2024");

    expect(onChange).toHaveBeenCalledWith(2024);
  });

  it("calls onChange with undefined when cleared", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateFilter value={2024} onChange={onChange} availableYears={[2024]} />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("sorts years in descending order", () => {
    render(
      <DateFilter onChange={() => {}} availableYears={[2022, 2025, 2023]} />,
    );

    const options = screen.getAllByRole("option");
    // First is placeholder, then years sorted descending
    expect(options[1]).toHaveTextContent("2025");
    expect(options[2]).toHaveTextContent("2023");
    expect(options[3]).toHaveTextContent("2022");
  });
});
