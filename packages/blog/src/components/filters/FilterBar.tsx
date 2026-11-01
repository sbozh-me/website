import { Button } from "@sbozh/react-ui/components/ui/button";

import { MonthFilter } from "./MonthFilter";
import { PersonaFilter } from "./PersonaFilter";
import { SearchFilter } from "./SearchFilter";
import { Select } from "./Select";
import { TagFilter } from "./TagFilter";

import type { PostFilters, PostSort } from "../../types/filters";
import type { FilterOptions } from "../../utils/post-filters";

export interface FilterBarProps {
  options: FilterOptions;
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

const SORT_OPTIONS = [{ value: "oldest", label: "Oldest first" }];

export function FilterBar({
  options,
  filters,
  onFiltersChange,
  onClear,
  hasActiveFilters,
  className = "",
}: FilterBarProps) {
  return (
    <div className={`grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap ${className}`}>
      {options.series.length > 0 && (
        <Select
          label="Filter by series"
          placeholder="All series"
          value={filters.series}
          options={options.series.map((item) => ({ value: item.slug, label: item.title }))}
          onChange={(series) => onFiltersChange({ ...filters, series })}
        />
      )}
      <TagFilter
        tags={options.tags}
        value={filters.tag}
        onChange={(tag) => onFiltersChange({ ...filters, tag })}
      />
      <MonthFilter
        months={options.months}
        value={filters.month}
        onChange={(month) => onFiltersChange({ ...filters, month })}
      />
      <PersonaFilter
        personas={options.personas}
        value={filters.persona}
        onChange={(persona) => onFiltersChange({ ...filters, persona })}
      />
      <Select
        label="Sort posts"
        placeholder="Newest first"
        value={filters.sort}
        options={SORT_OPTIONS}
        onChange={(sort) => onFiltersChange({ ...filters, sort: sort as PostSort | undefined })}
      />
      <SearchFilter
        value={filters.query}
        onChange={(query) => onFiltersChange({ ...filters, query })}
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
