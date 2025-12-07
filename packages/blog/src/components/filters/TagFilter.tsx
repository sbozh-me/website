import { Select } from "./Select";

import type { Tag } from "../../types/tag";

export interface TagFilterProps {
  tags: Tag[];
  value?: string;
  onChange: (tagSlug?: string) => void;
}

export function TagFilter({ tags, value, onChange }: TagFilterProps) {
  const options = tags.map((tag) => ({
    value: tag.slug,
    label: tag.name,
  }));

  return (
    <Select
      placeholder="All tags"
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
