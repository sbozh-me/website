"use client";

import { cn } from "../../lib/utils";

export interface PaymentQRProps {
  account: string;
  amount?: string;
  currency?: string;
  variableSymbol?: string;
  /** Precomputed SVG path covering the QR's dark modules. */
  qrPath: string;
  /** Module count per side (viewBox size). */
  qrSize: number;
  className?: string;
}

interface DetailRow {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}

/**
 * Payment panel — bank details beside a scannable Czech "QR Platba" code.
 * The QR matrix is encoded at parse time; this component only renders the path.
 */
export function PaymentQR({
  account,
  amount,
  currency = "CZK",
  variableSymbol,
  qrPath,
  qrSize,
  className,
}: PaymentQRProps) {
  const rows: DetailRow[] = [];
  if (account)
    rows.push({ label: "Č. účtu", value: account, strong: true });
  if (variableSymbol)
    rows.push({ label: "Variabilní symbol", value: variableSymbol });
  if (amount)
    rows.push({
      label: "Částka",
      value: `${amount}${/[a-zA-Zč]/.test(amount) ? "" : ` ${currency}`}`,
      strong: true,
    });

  return (
    <section className={cn("pmdxjs-pay", className)}>
      <div className="pmdxjs-pay-details">
        <h2 className="pmdxjs-pay-title">Platební údaje</h2>
        <dl className="pmdxjs-pay-list">
          {rows.map((row) => (
            <div className="pmdxjs-pay-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd
                className={cn(
                  row.strong && "pmdxjs-pay-strong",
                  row.mono && "pmdxjs-pay-mono",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="pmdxjs-qr">
        <svg
          className="pmdxjs-qr-img"
          viewBox={`0 0 ${qrSize} ${qrSize}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label="QR platba"
        >
          <path d={qrPath} fill="currentColor" />
        </svg>
        <span className="pmdxjs-qr-caption">QR Platba</span>
      </div>
    </section>
  );
}
