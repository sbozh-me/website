import { Select } from "./Select";

import type { Persona } from "../../types/persona";

export interface PersonaFilterProps {
  personas: Persona[];
  value?: string;
  onChange: (personaSlug?: string) => void;
}

export function PersonaFilter({
  personas,
  value,
  onChange,
}: PersonaFilterProps) {
  const options = personas.map((persona) => ({
    value: persona.slug,
    label: persona.name,
    color: persona.color,
  }));

  return (
    <Select
      placeholder="All personas"
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
