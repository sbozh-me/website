import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePostFilters } from "../../hooks/usePostFilters";

describe("usePostFilters", () => {
  it("returns empty filters by default", () => {
    const { result } = renderHook(() => usePostFilters());

    expect(result.current.filters).toEqual({});
  });

  it("accepts initial filters", () => {
    const initial = { year: 2024, tag: "tech" };
    const { result } = renderHook(() => usePostFilters(initial));

    expect(result.current.filters).toEqual(initial);
  });

  it("setFilter updates single filter", () => {
    const { result } = renderHook(() => usePostFilters());

    act(() => {
      result.current.setFilter("year", 2024);
    });

    expect(result.current.filters.year).toBe(2024);
  });

  it("setFilter preserves other filters", () => {
    const { result } = renderHook(() => usePostFilters({ year: 2024 }));

    act(() => {
      result.current.setFilter("tag", "tech");
    });

    expect(result.current.filters).toEqual({ year: 2024, tag: "tech" });
  });

  it("setFilters replaces all filters", () => {
    const { result } = renderHook(() =>
      usePostFilters({ year: 2024, tag: "tech" }),
    );

    act(() => {
      result.current.setFilters({ persona: "founder" });
    });

    expect(result.current.filters).toEqual({ persona: "founder" });
  });

  it("clearFilters removes all filters", () => {
    const { result } = renderHook(() =>
      usePostFilters({ year: 2024, tag: "tech", persona: "founder" }),
    );

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it("hasActiveFilters is false when no filters", () => {
    const { result } = renderHook(() => usePostFilters());

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("hasActiveFilters is true with persona filter", () => {
    const { result } = renderHook(() => usePostFilters({ persona: "founder" }));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("hasActiveFilters is true with tag filter", () => {
    const { result } = renderHook(() => usePostFilters({ tag: "tech" }));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("hasActiveFilters is true with year filter", () => {
    const { result } = renderHook(() => usePostFilters({ year: 2024 }));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("hasActiveFilters becomes false after clearing", () => {
    const { result } = renderHook(() => usePostFilters({ year: 2024 }));

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });
});
