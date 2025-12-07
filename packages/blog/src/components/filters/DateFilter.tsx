import { Select } from "./Select";

export interface DateFilterProps {
  value?: number;
  onChange: (year?: number) => void;
  availableYears?: number[];
}

export function DateFilter({
  value,
  onChange,
  availableYears = [],
}: DateFilterProps) {
  const currentYear = new Date().getFullYear();

  // Build year options from available years or default to current year
  const years =
    availableYears.length > 0
      ? [...new Set(availableYears)].sort((a, b) => b - a)
      : [currentYear];

  const options = years.map((year) => ({
    value: String(year),
    label: String(year),
  }));

  return (
    <Select
      placeholder="All time"
      value={value !== undefined ? String(value) : undefined}
      options={options}
      onChange={(val) => onChange(val ? parseInt(val, 10) : undefined)}
    />
  );
}
