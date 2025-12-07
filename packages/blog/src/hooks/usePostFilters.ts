"use client";

import { useCallback, useState } from "react";

import type { PostFilters } from "../types/filters";

export interface UsePostFiltersReturn {
  filters: PostFilters;
  setFilter: <K extends keyof PostFilters>(
    key: K,
    value: PostFilters[K],
  ) => void;
  setFilters: (filters: PostFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function usePostFilters(
  initialFilters: PostFilters = {},
): UsePostFiltersReturn {
  const [filters, setFiltersState] = useState<PostFilters>(initialFilters);

  const setFilter = useCallback(
    <K extends keyof PostFilters>(key: K, value: PostFilters[K]) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setFilters = useCallback((newFilters: PostFilters) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const hasActiveFilters =
    filters.persona !== undefined ||
    filters.tag !== undefined ||
    filters.year !== undefined;

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters,
  };
}
