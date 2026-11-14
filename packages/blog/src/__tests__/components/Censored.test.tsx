import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Censored } from "../../components/post/Censored";

describe("Censored", () => {
  it("renders plain text as is", () => {
    const { container } = render(<p><Censored text="Just text" /></p>);
    expect(container.innerHTML).toBe("<p>Just text</p>");
  });

  it("renders every (;) as the ✳ censor", () => {
    const { container } = render(<p><Censored text="My D(;)CK PITCH. Only (;)(;) knows" /></p>);
    expect(container.querySelectorAll(".censor")).toHaveLength(3);
    expect(container.textContent).toBe("My D✳CK PITCH. Only ✳✳ knows");
  });

  it("renders a flattened title's ✳ as the censor", () => {
    const { container } = render(<h2><Censored text="A co má B✳h mezi nohama?" /></h2>);
    expect(container.querySelectorAll(".censor")).toHaveLength(1);
    expect(container.textContent).toBe("A co má B✳h mezi nohama?");
  });
});
