import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const captureException = vi.fn();

vi.mock("@/lib/analytics/tracker", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

import GlobalError from "./global-error";

describe("GlobalError", () => {
  beforeEach(() => {
    captureException.mockReset();
  });

  it("reports the error and renders a retry button", () => {
    const reset = vi.fn();
    const err = Object.assign(new Error("boom"), { digest: "abc" });
    render(<GlobalError error={err} reset={reset} />);
    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(err);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
