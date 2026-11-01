import { Select, type SelectOption } from "./Select";

export interface MonthFilterProps {
  months: SelectOption[];
  value?: string;
  onChange: (month?: string) => void;
}

export function MonthFilter({ months, value, onChange }: MonthFilterProps) {
  return (
    <Select
      label="Filter by month"
      placeholder="All time"
      value={value}
      options={months}
      onChange={onChange}
    />
  );
}
