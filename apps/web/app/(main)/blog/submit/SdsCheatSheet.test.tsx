import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SdsCheatSheet } from "./SdsCheatSheet";

describe("SdsCheatSheet", () => {
  it("shows each syntax next to its live result", async () => {
    render(await SdsCheatSheet());

    expect(screen.getByText("==word|meaning==")).toBeInTheDocument();
    const live = screen.getAllByTestId("sds-live");
    expect(live).toHaveLength(8);
    expect(live[0]).toHaveTextContent("word");
    expect(live[0]).not.toHaveTextContent("==");
    expect(live[7].querySelector('[data-voice="teal"]')).not.toBeNull();
  });

  it("has the window switch", async () => {
    render(await SdsCheatSheet());
    expect(screen.getByRole("button", { name: /window/i })).toBeInTheDocument();
  });

  it("turns off ligatures so == reads as typed", async () => {
    render(await SdsCheatSheet());
    expect(screen.getByText("==word|meaning==").className).toContain("[font-variant-ligatures:none]");
  });
});
