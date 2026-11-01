import { Input } from "@sbozh/react-ui/components/ui/input";

export interface SearchFilterProps {
  value?: string;
  onChange: (query?: string) => void;
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  return (
    <div className="relative col-span-2 sm:col-auto">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <Input
        type="search"
        aria-label="Search posts"
        placeholder="Search"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || undefined)}
        className="pl-9 w-full sm:w-44"
      />
    </div>
  );
}
