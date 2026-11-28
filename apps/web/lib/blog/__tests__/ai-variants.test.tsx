import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  AiVariantBlock,
  AiVariantProvider,
  AiVariantSwitcher,
  paramForVariant,
  variantFromParam,
  type AiVariantCode,
} from "../ai-variants";
import { setAiVariant } from "../ai-variants/store";
import { SwitcherBar } from "../switcher-tabs";

function Post({ variants, initial }: { variants: string[]; initial?: AiVariantCode }) {
  return (
    <AiVariantProvider variants={variants} initial={initial}>
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
    window.history.replaceState(null, "", "/library/stories/post?draft=1#part-2");
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

describe("AI variant in the URL", () => {
  beforeEach(() => {
    act(() => setAiVariant("ai"));
    window.localStorage.clear();
    window.history.replaceState(null, "", "/library/stories/post?draft=1#part-2");
  });

  it("reads ?version= values", () => {
    expect(variantFromParam("ai")).toBe("ai");
    expect(variantFromParam("no-ai")).toBe("nai");
    expect(variantFromParam(" No-AI ")).toBe("nai");
    expect(variantFromParam("noai")).toBe("nai");
    expect(variantFromParam("nai")).toBe("nai");
    expect(variantFromParam(["no-ai", "ai"])).toBe("nai");
    expect(variantFromParam("robot")).toBeUndefined();
    expect(variantFromParam(undefined)).toBeUndefined();
    expect(paramForVariant("ai")).toBe("ai");
    expect(paramForVariant("nai")).toBe("no-ai");
  });

  it("server-renders the version the URL asks for", () => {
    const html = renderToString(<Post variants={["ai", "nai"]} initial="nai" />);
    expect(html).toContain("Without AI");
    expect(html).not.toContain("With AI<");
  });

  it("opens exactly the URL's version over the remembered one, and remembers it", () => {
    window.localStorage.setItem("ai-variant", "ai");
    render(<Post variants={["ai", "nai"]} initial="nai" />);
    expect(screen.getByText("Without AI")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "No AI" })).toHaveAttribute("aria-selected", "true");
    expect(window.localStorage.getItem("ai-variant")).toBe("nai");
    expect(window.location.search).toBe("?draft=1&version=no-ai");
  });

  it("opens the AI version from ?version=ai even when No AI is remembered", () => {
    window.localStorage.setItem("ai-variant", "nai");
    render(<Post variants={["ai", "nai"]} initial="ai" />);
    expect(screen.getByText("With AI")).toBeInTheDocument();
  });

  it("keeps a first-time reader's URL clean", () => {
    render(<Post variants={["ai", "nai"]} />);
    expect(window.location.search).toBe("?draft=1");
  });

  it("writes the picked version into the URL, keeping other params and the hash", () => {
    render(<Post variants={["ai", "nai"]} />);
    fireEvent.click(screen.getByRole("tab", { name: "No AI" }));
    expect(window.location.search).toBe("?draft=1&version=no-ai");
    expect(window.location.hash).toBe("#part-2");
    fireEvent.click(screen.getByRole("tab", { name: "AI" }));
    expect(window.location.search).toBe("?draft=1&version=ai");
  });

  it("puts a remembered choice into the URL", () => {
    window.localStorage.setItem("ai-variant", "nai");
    render(<Post variants={["ai", "nai"]} />);
    expect(screen.getByText("Without AI")).toBeInTheDocument();
    expect(window.location.search).toBe("?draft=1&version=no-ai");
  });

  it("follows a new ?version= on the same page", () => {
    const { rerender } = render(<Post variants={["ai", "nai"]} initial="ai" />);
    expect(screen.getByText("With AI")).toBeInTheDocument();
    rerender(<Post variants={["ai", "nai"]} initial="nai" />);
    expect(screen.getByText("Without AI")).toBeInTheDocument();
  });

  it("leaves the URL alone on a post without versions", () => {
    window.localStorage.setItem("ai-variant", "nai");
    render(<Post variants={[]} />);
    expect(window.location.search).toBe("?draft=1");
  });
});
