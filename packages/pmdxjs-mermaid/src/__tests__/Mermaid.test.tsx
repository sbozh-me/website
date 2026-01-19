import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Mermaid } from "../components/Mermaid";
import { MermaidError } from "../components/Error";
import { Loading } from "../components/Loading";

describe("Mermaid", () => {
  it("should render loading state initially", () => {
    render(<Mermaid content="graph TD\n  A --> B" language="mermaid" />);

    expect(screen.getByText("Loading diagram...")).toBeInTheDocument();
  });

  it("should render diagram after loading", async () => {
    render(<Mermaid content="graph TD\n  A --> B" language="mermaid" />);

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-svg")).toBeInTheDocument();
    });
  });

  it("should accept custom className", async () => {
    const { container } = render(
      <Mermaid
        content="graph TD\n  A --> B"
        language="mermaid"
        className="custom-class"
      />,
    );

    await waitFor(() => {
      const mermaidDiv = container.querySelector(".pmdxjs-mermaid");
      expect(mermaidDiv).toHaveClass("custom-class");
    });
  });

  it("should use custom loading component", () => {
    const CustomLoading = () => (
      <div data-testid="custom-loading">Custom Loading</div>
    );

    render(
      <Mermaid
        content="graph TD\n  A --> B"
        language="mermaid"
        options={{ LoadingComponent: CustomLoading }}
      />,
    );

    expect(screen.getByTestId("custom-loading")).toBeInTheDocument();
  });
});

describe("Loading", () => {
  it("should render loading message", () => {
    render(<Loading />);

    expect(screen.getByText("Loading diagram...")).toBeInTheDocument();
  });

  it("should have correct class name", () => {
    const { container } = render(<Loading />);

    expect(
      container.querySelector(".pmdxjs-mermaid-loading"),
    ).toBeInTheDocument();
  });
});

describe("MermaidError", () => {
  it("should render error message", () => {
    const error = new Error("Test error message");
    render(<MermaidError error={error} />);

    expect(screen.getByText("Failed to render diagram")).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should have correct class name", () => {
    const error = new Error("Test error");
    const { container } = render(<MermaidError error={error} />);

    expect(
      container.querySelector(".pmdxjs-mermaid-error"),
    ).toBeInTheDocument();
  });
});
