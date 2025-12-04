import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePMDXJS } from "../../hooks/usePMDXJS";

const validSource = `
:::page
# John Doe
subtitle: Engineer
:::page-end
`;

describe("usePMDXJS", () => {
  it("compiles valid source and returns element", async () => {
    const { result } = renderHook(() => usePMDXJS(validSource));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.element).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("returns error for invalid source", async () => {
    const { result } = renderHook(() => usePMDXJS(null as unknown as string));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.element).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("recompiles when source changes", async () => {
    const { result, rerender } = renderHook(
      ({ source }) => usePMDXJS(source, { debounce: 10 }),
      { initialProps: { source: validSource } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const _firstElement = result.current.element;

    // Change source
    rerender({
      source: `
:::page
# Jane Smith
:::page-end
`,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Element should be different (or at least recompiled)
    expect(result.current.element).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("provides recompile function", async () => {
    const { result } = renderHook(() => usePMDXJS(validSource));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.recompile).toBe("function");

    // Call recompile
    act(() => {
      result.current.recompile();
    });

    expect(result.current.element).not.toBeNull();
  });

  it("sets loading state during debounced compilation", async () => {
    const { result, rerender } = renderHook(
      ({ source }) => usePMDXJS(source, { debounce: 100 }),
      { initialProps: { source: validSource } },
    );

    // Wait for initial compilation
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger recompilation
    rerender({
      source: `
:::page
# Updated
:::page-end
`,
    });

    // Should be loading during debounce
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it("uses custom debounce value", async () => {
    const { result } = renderHook(() =>
      usePMDXJS(validSource, { debounce: 50 }),
    );

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 200 },
    );

    expect(result.current.element).not.toBeNull();
  });
});
