import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PersonaFilter } from "../../../components/filters/PersonaFilter";

import type { Persona } from "../../../types/persona";

const mockPersonas: Persona[] = [
  { id: "1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
  { id: "2", name: "Kagurame", slug: "kagurame", color: "#f59e0b" },
  { id: "3", name: "Semenus", slug: "semenus", color: "#22c55e" },
];

describe("PersonaFilter", () => {
  it("renders with 'All personas' placeholder", () => {
    render(<PersonaFilter personas={mockPersonas} onChange={() => {}} />);

    expect(screen.getByRole("combobox")).toHaveDisplayValue("All personas");
  });

  it("renders all persona options", () => {
    render(<PersonaFilter personas={mockPersonas} onChange={() => {}} />);

    expect(screen.getByText("The Founder")).toBeInTheDocument();
    expect(screen.getByText("Kagurame")).toBeInTheDocument();
    expect(screen.getByText("Semenus")).toBeInTheDocument();
  });

  it("displays selected persona", () => {
    render(
      <PersonaFilter
        personas={mockPersonas}
        value="kagurame"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveDisplayValue("Kagurame");
  });

  it("calls onChange with persona slug when selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<PersonaFilter personas={mockPersonas} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "founder");

    expect(onChange).toHaveBeenCalledWith("founder");
  });

  it("calls onChange with undefined when cleared", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PersonaFilter
        personas={mockPersonas}
        value="founder"
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
