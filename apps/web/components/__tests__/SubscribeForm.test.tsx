import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubscribeForm } from "../SubscribeForm";

describe("SubscribeForm", () => {
  it("is footer-sized by default", () => {
    const { container } = render(<SubscribeForm />);
    expect(container.querySelector("form")).toHaveAttribute("data-size", "default");
    expect(container.querySelector("form")).toHaveClass("max-w-md");
    expect(screen.getByRole("textbox", { name: "Email address" })).not.toHaveClass("h-12");
  });

  it("grows for the /subscribe page", () => {
    const { container } = render(<SubscribeForm size="large" />);
    expect(container.querySelector("form")).toHaveClass("max-w-xl");
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveClass("h-12");
    expect(screen.getByRole("button", { name: "Subscribe" })).toHaveClass("h-12");
    expect(screen.getByText("Blog posts")).toHaveClass("text-sm");
  });
});
