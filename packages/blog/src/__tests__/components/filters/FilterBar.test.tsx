import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FilterBar } from "../../../components/filters/FilterBar";

import type { Persona } from "../../../types/persona";
import type { Tag } from "../../../types/tag";

const mockPersonas: Persona[] = [
  { id: "1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
  { id: "2", name: "Kagurame", slug: "kagurame", color: "#f59e0b" },
];

const mockTags: Tag[] = [
  { id: "1", name: "Tech", slug: "tech" },
  { id: "2", name: "Personal", slug: "personal" },
];

describe("FilterBar", () => {
  it("renders all three filter dropdowns", () => {
    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={() => {}}
      />,
    );

    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(3);
  });

  it("renders search placeholder", () => {
    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={() => {}}
      />,
    );

    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("passes year filter value correctly", () => {
    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{ year: 2024 }}
        onFiltersChange={() => {}}
        availableYears={[2024]}
      />,
    );

    expect(screen.getAllByRole("combobox")[0]).toHaveDisplayValue("2024");
  });

  it("passes tag filter value correctly", () => {
    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{ tag: "tech" }}
        onFiltersChange={() => {}}
      />,
    );

    expect(screen.getAllByRole("combobox")[1]).toHaveDisplayValue("Tech");
  });

  it("passes persona filter value correctly", () => {
    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{ persona: "founder" }}
        onFiltersChange={() => {}}
      />,
    );

    expect(screen.getAllByRole("combobox")[2]).toHaveDisplayValue(
      "The Founder",
    );
  });

  it("calls onFiltersChange when year changes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={onFiltersChange}
        availableYears={[2024]}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[0], "2024");

    expect(onFiltersChange).toHaveBeenCalledWith({ year: 2024 });
  });

  it("calls onFiltersChange when tag changes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={onFiltersChange}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[1], "tech");

    expect(onFiltersChange).toHaveBeenCalledWith({ tag: "tech" });
  });

  it("calls onFiltersChange when persona changes", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={onFiltersChange}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[2], "founder");

    expect(onFiltersChange).toHaveBeenCalledWith({ persona: "founder" });
  });

  it("preserves existing filters when changing one", async () => {
    const onFiltersChange = vi.fn();
    const user = userEvent.setup();

    render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{ year: 2024, tag: "tech" }}
        onFiltersChange={onFiltersChange}
        availableYears={[2024]}
      />,
    );

    await user.selectOptions(screen.getAllByRole("combobox")[2], "founder");

    expect(onFiltersChange).toHaveBeenCalledWith({
      year: 2024,
      tag: "tech",
      persona: "founder",
    });
  });

  it("applies custom className", () => {
    const { container } = render(
      <FilterBar
        personas={mockPersonas}
        tags={mockTags}
        filters={{}}
        onFiltersChange={() => {}}
        className="custom-class"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
