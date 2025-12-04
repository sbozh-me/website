import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Divider } from "../../../components/cv";

describe("Divider", () => {
  it("renders hr element", () => {
    render(<Divider />);
    expect(document.querySelector("hr")).toBeInTheDocument();
  });

  it("has pmdxjs-divider class", () => {
    render(<Divider />);
    expect(document.querySelector(".pmdxjs-divider")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Divider className="custom-divider" />);
    expect(document.querySelector(".custom-divider")).toBeInTheDocument();
  });
});
