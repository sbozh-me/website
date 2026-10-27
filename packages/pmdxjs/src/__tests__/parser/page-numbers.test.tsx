import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parse } from "../../parser";
import { compile } from "../../runtime/compile";

const pages = (config: string) => `:::config
${config}
:::

:::page
First
:::page-end

:::page
Second
:::page-end
`;

describe("page-numbers config", () => {
  it("parses the label", () => {
    expect(parse(pages("page-numbers: Strana")).config.pageNumbers).toBe(
      "Strana",
    );
  });

  it("prints label, number and total on every page", () => {
    const { element } = compile(pages("page-numbers: Strana"));
    const { container } = render(<>{element}</>);
    const numbers = [...container.querySelectorAll(".pmdxjs-page-number")];
    expect(numbers.map((n) => n.textContent)).toEqual([
      "Strana 1/2",
      "Strana 2/2",
    ]);
  });

  it("prints nothing without the option", () => {
    const { element } = compile(pages("format: A4"));
    const { container } = render(<>{element}</>);
    expect(container.querySelector(".pmdxjs-page-number")).toBeNull();
  });
});
