import { DateFilter } from "./DateFilter";
import { PersonaFilter } from "./PersonaFilter";
import { SearchPlaceholder } from "./SearchPlaceholder";
import { TagFilter } from "./TagFilter";

import type { PostFilters } from "../../types/filters";
import type { Persona } from "../../types/persona";
import type { Tag } from "../../types/tag";

export interface FilterBarProps {
  personas: Persona[];
  tags: Tag[];
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  availableYears?: number[];
  className?: string;
}

export function FilterBar({
  personas,
  tags,
  filters,
  onFiltersChange,
  availableYears,
  className = "",
}: FilterBarProps) {
  const handleYearChange = (year?: number) => {
    onFiltersChange({ ...filters, year });
  };

  const handleTagChange = (tag?: string) => {
    onFiltersChange({ ...filters, tag });
  };

  const handlePersonaChange = (persona?: string) => {
    onFiltersChange({ ...filters, persona });
  };

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <DateFilter
        value={filters.year}
        onChange={handleYearChange}
        availableYears={availableYears}
      />
      <TagFilter tags={tags} value={filters.tag} onChange={handleTagChange} />
      <PersonaFilter
        personas={personas}
        value={filters.persona}
        onChange={handlePersonaChange}
      />
      <div className="ml-auto">
        <SearchPlaceholder />
      </div>
    </div>
  );
}
