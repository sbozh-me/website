import { evaluate } from "@mdx-js/mdx";
import { fireEvent, render, screen } from "@testing-library/react";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { ACCORDION_DEFAULT_TITLE, Accordion } from "../accordion";

describe("Accordion", () => {
  it("starts closed and shows the text once the title is clicked", () => {
    render(
      <Accordion title="Original version">
        <p>The old text.</p>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Original version" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("The old text.")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The old text.")).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("falls back to a default title and can start open", () => {
    render(
      <Accordion open>
        <p>The old text.</p>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: ACCORDION_DEFAULT_TITLE })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("The old text.")).toBeInTheDocument();
  });

  it("renders markdown written inside the MDX tag", async () => {
    const source = '<Accordion title="Old">\n\nSome **bold** text.\n\n- a\n- b\n\n</Accordion>';
    const { default: Content } = await evaluate(source, { ...runtime, remarkPlugins: [remarkGfm] } as any);
    render(<Content components={{ Accordion }} />);
    fireEvent.click(screen.getByRole("button", { name: "Old" }));
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
