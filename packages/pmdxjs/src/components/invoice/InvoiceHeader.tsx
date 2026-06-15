"use client";

import { cn } from "../../lib/utils";

export interface InvoiceHeaderProps {
  title?: string;
  /** Optional small line above the title. Omitted when empty. */
  subtitle?: string;
  number?: string;
  issued?: string;
  due?: string;
  payment?: string;
  className?: string;
}

interface MetaCell {
  label: string;
  value: string;
  strong?: boolean;
}

/**
 * Invoice masthead — title, number badge and a meta strip of document dates.
 * Styling handled via CSS variables in globals.css.
 */
export function InvoiceHeader({
  title = "Faktura",
  subtitle,
  number,
  issued,
  due,
  payment,
  className,
}: InvoiceHeaderProps) {
  const cells: MetaCell[] = [];
  if (issued) cells.push({ label: "Datum vystavení", value: issued });
  if (due) cells.push({ label: "Datum splatnosti", value: due, strong: true });
  if (payment) cells.push({ label: "Způsob úhrady", value: payment });

  return (
    <div className={cn("pmdxjs-invoice", className)}>
      <div className="pmdxjs-invoice-head">
        <div>
          {subtitle && (
            <div className="pmdxjs-invoice-eyebrow">{subtitle}</div>
          )}
          <h1 className="pmdxjs-invoice-title">{title}</h1>
        </div>
        {number && (
          <div className="pmdxjs-invoice-number">
            <span className="pmdxjs-invoice-number-label">Číslo faktury</span>
            <span className="pmdxjs-invoice-number-value">{number}</span>
          </div>
        )}
      </div>

      {cells.length > 0 && (
        <div className="pmdxjs-invoice-meta">
          {cells.map((cell) => (
            <div className="pmdxjs-invoice-meta-cell" key={cell.label}>
              <span className="pmdxjs-invoice-meta-label">{cell.label}</span>
              <span
                className={cn(
                  "pmdxjs-invoice-meta-value",
                  cell.strong && "pmdxjs-invoice-meta-value--strong",
                )}
              >
                {cell.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
