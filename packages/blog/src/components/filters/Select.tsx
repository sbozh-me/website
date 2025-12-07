export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface SelectProps {
  placeholder: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string | undefined) => void;
  className?: string;
}

export function Select({
  placeholder,
  value,
  options,
  onChange,
  className = "",
}: SelectProps) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
      className={`bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground min-w-[120px] focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
