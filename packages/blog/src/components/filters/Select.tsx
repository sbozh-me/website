"use client";

import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Select as ShadcnSelect,
} from "@sbozh/react-ui/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

/** Radix can't select an empty value, so "nothing chosen" needs a value of its own */
const NONE = "__none__";

export interface SelectProps {
  /** Accessible name */
  label: string;
  /** Shown when nothing is chosen, and offered as the option that clears the choice */
  placeholder: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string | undefined) => void;
  className?: string;
}

export function Select({
  label,
  placeholder,
  value,
  options,
  onChange,
  className = "w-full sm:w-44",
}: SelectProps) {
  return (
    <ShadcnSelect
      value={value ?? NONE}
      onValueChange={(val) => onChange(val === NONE ? undefined : val)}
    >
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
}
