import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Tag, Tags } from "../../../components/cv";

describe("Tag", () => {
  it("renders tag text", () => {
    render(<Tag>TypeScript</Tag>);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Tag className="custom-tag">React</Tag>);
    expect(document.querySelector(".custom-tag")).toBeInTheDocument();
  });

  it("has pmdxjs-tag class", () => {
    render(<Tag>Node.js</Tag>);
    expect(document.querySelector(".pmdxjs-tag")).toBeInTheDocument();
  });
});

describe("Tags", () => {
  it("renders all items", () => {
    render(<Tags items={["TypeScript", "React", "Node.js"]} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("renders empty when no items", () => {
    render(<Tags items={[]} />);
    expect(document.querySelector(".pmdxjs-tags")).toBeInTheDocument();
    expect(document.querySelectorAll(".pmdxjs-tag")).toHaveLength(0);
  });

  it("applies custom className", () => {
    render(<Tags items={["Test"]} className="custom-tags" />);
    expect(document.querySelector(".custom-tags")).toBeInTheDocument();
  });
});
