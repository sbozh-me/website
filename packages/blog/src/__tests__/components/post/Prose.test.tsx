import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "../../../components/post/Prose";

describe("Prose", () => {
  it("renders children content", () => {
    const { container } = render(
      <Prose>
        <p>Test content</p>
      </Prose>
    );

    expect(container.textContent).toBe("Test content");
  });

  it("applies prose class", () => {
    const { container } = render(
      <Prose>
        <p>Content</p>
      </Prose>
    );

    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(
      <Prose className="custom-class">
        <p>Content</p>
      </Prose>
    );

    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toHaveClass("prose", "custom-class");
  });

  it("renders complex MDX content", () => {
    const { container } = render(
      <Prose>
        <h2>Heading</h2>
        <p>Paragraph with <code>inline code</code></p>
        <pre><code>const x = 1;</code></pre>
      </Prose>
    );

    expect(container.querySelector("h2")).toBeInTheDocument();
    expect(container.querySelector("code")).toBeInTheDocument();
    expect(container.querySelector("pre")).toBeInTheDocument();
  });
});
