import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AiVariantBlock, AiVariantProvider, AiVariantSwitcher } from "../ai-variants";
import { setAiVariant } from "../ai-variants/store";
import { SwitcherBar } from "../switcher-tabs";

function Post({ variants }: { variants: string[] }) {
  return (
    <AiVariantProvider variants={variants}>
      <SwitcherBar>
        <AiVariantSwitcher />
      </SwitcherBar>
      <p>Shared intro</p>
      {variants.includes("ai") && <AiVariantBlock variant="ai">With AI</AiVariantBlock>}
      {variants.includes("nai") && <AiVariantBlock variant="nai">Without AI</AiVariantBlock>}
    </AiVariantProvider>
  );
}

describe("AI variant switcher", () => {
  beforeEach(() => {
    act(() => setAiVariant("ai"));
    window.localStorage.clear();
  });

  it("shows the AI version by default, with AI first in the switcher", () => {
    render(<Post variants={["ai", "nai"]} />);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["AI", "No AI"]);
    expect(screen.getByRole("tab", { name: "AI" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("With AI")).toBeInTheDocument();
    expect(screen.queryByText("Without AI")).not.toBeInTheDocument();
    expect(screen.getByText("Shared intro")).toBeInTheDocument();
  });

  it("switches to the No AI version and remembers it", () => {
    render(<Post variants={["ai", "nai"]} />);
    fireEvent.click(screen.getByRole("tab", { name: "No AI" }));
    expect(screen.getByText("Without AI")).toBeInTheDocument();
    expect(screen.queryByText("With AI")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "No AI" })).toHaveAttribute("aria-selected", "true");
    expect(window.localStorage.getItem("ai-variant")).toBe("nai");
  });

  it("restores the reader's stored choice", () => {
    window.localStorage.setItem("ai-variant", "nai");
    render(<Post variants={["ai", "nai"]} />);
    expect(screen.getByText("Without AI")).toBeInTheDocument();
  });

  it("ignores a stored value that isn't a variant", () => {
    window.localStorage.setItem("ai-variant", "robot");
    render(<Post variants={["ai", "nai"]} />);
    expect(screen.getByText("With AI")).toBeInTheDocument();
  });

  it("falls back to the only version a post has", () => {
    render(<Post variants={["nai"]} />);
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["No AI"]);
    expect(screen.getByRole("tab", { name: "No AI" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Without AI")).toBeInTheDocument();
  });

  it("shows no buttons when the post has no versions", () => {
    render(<Post variants={[]} />);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders nothing for an unknown variant", () => {
    render(
      <AiVariantProvider variants={["ai"]}>
        <AiVariantBlock variant="robot">Robot</AiVariantBlock>
      </AiVariantProvider>,
    );
    expect(screen.queryByText("Robot")).not.toBeInTheDocument();
  });
});
