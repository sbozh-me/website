"use client";

import { cn } from "../../lib/utils";

export interface FieldProps {
  caption: string;
  /** Pre-filled value written on the line. Omitted → blank line to fill by hand. */
  value?: string;
  className?: string;
}

/**
 * Fill-in field — a ruled line (optionally pre-filled) with a small caption
 * beneath, as on Czech paper forms ("Jméno a příjmení, datum narození …").
 */
export function Field({ caption, value, className }: FieldProps) {
  return (
    <div className={cn("pmdxjs-field", className)}>
      <div className="pmdxjs-field-line">
        {value && <span className="pmdxjs-field-value">{value}</span>}
      </div>
      <span className="pmdxjs-field-caption">({caption})</span>
    </div>
  );
}
