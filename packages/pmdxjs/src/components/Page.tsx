"use client";

import { cn } from "../lib/utils";
import { useDocumentConfig } from "../transformer/context";

import type { ReactNode } from "react";

export interface PageProps {
  children: ReactNode;
  className?: string;
}

/**
 * Page dimensions in mm
 */
const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
} as const;

/**
 * Page component - represents a single page in the document
 *
 * Applies page sizing based on format (A4/Letter) and margins from config.
 * The bottom-right corner of the content area can carry a `logo`, or a `qr`
 * code (with the logo in its centre and an optional `qr-label` caption) —
 * both come from the document config and repeat on every page.
 */
export function Page({ children, className }: PageProps) {
  const config = useDocumentConfig();
  const size = PAGE_SIZES[config.format];
  const [marginTop, marginRight, marginBottom, marginLeft] = config.margins;

  return (
    <div
      className={cn(
        "pmdxjs-page",
        "relative",
        "mx-auto mb-8 last:mb-0",
        "shadow-lg print:shadow-none",
        "rounded-sm",
        "overflow-hidden",
        className,
      )}
      style={{
        width: `${size.width}mm`,
        height: `${size.height}mm`,
        padding: `${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm`,
      }}
    >
      {children}
      {(config.qr || config.logo) && (
        <div
          className="pmdxjs-page-corner"
          style={{
            position: "absolute",
            right: `${marginRight}mm`,
            bottom: `${marginBottom}mm`,
            display: "flex",
            alignItems: "center",
            gap: "3mm",
          }}
        >
          {config.qr && config.qrPath ? (
            <>
              {config.qrLabel && (
                <span
                  className="pmdxjs-page-qr-label"
                  style={{
                    fontSize: "0.6rem",
                    lineHeight: 1.2,
                    letterSpacing: "0.02em",
                    color: "var(--cv-muted-foreground, #6b7280)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {config.qrLabel} →
                </span>
              )}
              <a
                className="pmdxjs-page-qr"
                href={config.qr}
                aria-label={`Open ${config.qr}`}
                style={{
                  position: "relative",
                  display: "block",
                  width: "18mm",
                  height: "18mm",
                  padding: "1mm",
                  boxSizing: "border-box",
                  background: "#ffffff",
                  borderRadius: "1mm",
                  lineHeight: 0,
                }}
              >
                <svg
                  className="pmdxjs-page-qr-code"
                  viewBox={`0 0 ${config.qrSize} ${config.qrSize}`}
                  width="100%"
                  height="100%"
                  shapeRendering="crispEdges"
                  role="img"
                  aria-label="QR code"
                >
                  <path d={config.qrPath} fill="#111111" />
                </svg>
                {config.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="pmdxjs-page-qr-logo"
                    src={config.logo}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "5.5mm",
                      height: "5.5mm",
                      transform: "translate(-50%, -50%)",
                      background: "#ffffff",
                      padding: "0.5mm",
                      borderRadius: "0.8mm",
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </a>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="pmdxjs-page-logo"
              src={config.logo}
              alt=""
              aria-hidden="true"
              style={{ width: "9mm", height: "auto", display: "block" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
