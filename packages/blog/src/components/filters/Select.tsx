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
  className,
}: SelectProps) {
  return (
    <ShadcnSelect
      value={value ?? ""}
      onValueChange={(val) => onChange(val || undefined)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
}
