import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagFilter } from "../../../components/filters/TagFilter";

import type { Tag } from "../../../types/tag";

const mockTags: Tag[] = [
  { id: "1", name: "React", slug: "react" },
  { id: "2", name: "TypeScript", slug: "typescript" },
  { id: "3", name: "Testing", slug: "testing" },
];

describe("TagFilter", () => {
  it("renders with 'All tags' placeholder", () => {
    render(<TagFilter tags={mockTags} onChange={() => {}} />);

    expect(screen.getByRole("combobox")).toHaveDisplayValue("All tags");
  });

  it("renders all tag options", () => {
    render(<TagFilter tags={mockTags} onChange={() => {}} />);

    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Testing")).toBeInTheDocument();
  });

  it("displays selected tag", () => {
    render(
      <TagFilter tags={mockTags} value="typescript" onChange={() => {}} />,
    );

    expect(screen.getByRole("combobox")).toHaveDisplayValue("TypeScript");
  });

  it("calls onChange with tag slug when selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TagFilter tags={mockTags} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "react");

    expect(onChange).toHaveBeenCalledWith("react");
  });

  it("calls onChange with undefined when cleared", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<TagFilter tags={mockTags} value="react" onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "");

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
