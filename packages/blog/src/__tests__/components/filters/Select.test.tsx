import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Select } from "../../../components/filters/Select";

const options = [
  { value: "opt1", label: "Option 1" },
  { value: "opt2", label: "Option 2" },
  { value: "opt3", label: "Option 3" },
];

describe("Select", () => {
  it("renders placeholder option", () => {
    render(
      <Select
        placeholder="Select an option"
        options={options}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveDisplayValue("Select an option");
  });

  it("renders all options", () => {
    render(
      <Select placeholder="Choose" options={options} onChange={() => {}} />,
    );

    const selectEl = screen.getByRole("combobox");
    expect(selectEl.querySelectorAll("option")).toHaveLength(4); // placeholder + 3 options
  });

  it("displays selected value", () => {
    render(
      <Select
        placeholder="Choose"
        value="opt2"
        options={options}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveDisplayValue("Option 2");
  });

  it("calls onChange with value when option selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select placeholder="Choose" options={options} onChange={onChange} />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "opt1");

    expect(onChange).toHaveBeenCalledWith("opt1");
  });

  it("calls onChange with undefined when placeholder selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select
        placeholder="Choose"
        value="opt1"
        options={options}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("applies custom className", () => {
    render(
      <Select
        placeholder="Choose"
        options={options}
        onChange={() => {}}
        className="custom-class"
      />,
    );

    expect(screen.getByRole("combobox")).toHaveClass("custom-class");
  });
});
