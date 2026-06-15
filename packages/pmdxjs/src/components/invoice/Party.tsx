"use client";

import { cn } from "../../lib/utils";

export interface PartyProps {
  role: string;
  name: string;
  lines?: string[];
  className?: string;
}

/**
 * Party card — a supplier (Dodavatel) or customer (Odběratel) block.
 * First line is the name; remaining lines are address/contact detail. Lines
 * carrying an identifier (IČ / DIČ) are pulled into a footer row.
 */
export function Party({ role, name, lines = [], className }: PartyProps) {
  const idRegex = /^(IČ|IC|DIČ|DIC)\b/i;
  const detailLines = lines.filter((line) => !idRegex.test(line));
  const idLines = lines.filter((line) => idRegex.test(line));

  return (
    <div className={cn("pmdxjs-party", className)}>
      <span className="pmdxjs-party-role">{role}</span>
      <div className="pmdxjs-party-name">{name}</div>
      {detailLines.length > 0 && (
        <div className="pmdxjs-party-lines">
          {detailLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}
      {idLines.length > 0 && (
        <div className="pmdxjs-party-ids">
          {idLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </div>
      )}
    </div>
  );
}
