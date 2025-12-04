import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PMDXJSErrorBoundary } from "../../runtime/error-boundary";

// Component that throws an error
function ThrowError(): never {
  throw new Error("Test error");
}

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe("PMDXJSErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <PMDXJSErrorBoundary>
        <div>Child content</div>
      </PMDXJSErrorBoundary>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders default error UI when child throws", () => {
    render(
      <PMDXJSErrorBoundary>
        <ThrowError />
      </PMDXJSErrorBoundary>,
    );

    expect(screen.getByText("Rendering Error")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders custom fallback element", () => {
    render(
      <PMDXJSErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError />
      </PMDXJSErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });

  it("renders custom fallback function with error", () => {
    render(
      <PMDXJSErrorBoundary
        fallback={(error) => <div>Error: {error.message}</div>}
      >
        <ThrowError />
      </PMDXJSErrorBoundary>,
    );

    expect(screen.getByText("Error: Test error")).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <PMDXJSErrorBoundary onError={onError}>
        <ThrowError />
      </PMDXJSErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("Test error");
  });
});
