"use client";

import { QrTile } from "../Page";
import { cn } from "../../lib/utils";

export interface LinkQrProps {
  href: string;
  caption?: string;
  /** Precomputed SVG path of the QR's dark modules */
  qrPath: string;
  /** Module count per side */
  qrSize: number;
  className?: string;
}

/**
 * Scannable link inside the content flow, with an optional caption beside it.
 * The QR matrix is encoded at parse time; this component only renders the path.
 */
export function LinkQr({ href, caption, qrPath, qrSize, className }: LinkQrProps) {
  return (
    <div
      className={cn("pmdxjs-link-qr", className)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "3mm",
        marginTop: "2mm",
      }}
    >
      <QrTile
        href={href}
        size={qrSize}
        path={qrPath}
        style={{ width: "20mm", height: "20mm", flexShrink: 0 }}
      />
      {caption && <span className="pmdxjs-link-qr-caption">{caption}</span>}
    </div>
  );
}
