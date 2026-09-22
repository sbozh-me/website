/**
 * Document format (page size)
 */
export type DocumentFormat = "A4" | "Letter";

/**
 * Margin configuration [top, right, bottom, left] in millimeters
 */
export type Margins = [number, number, number, number];

/**
 * Document configuration parsed from :::config block
 */
export interface DocumentConfig {
  format: DocumentFormat;
  margins: Margins;
  theme?: string;
  /** Optional logo image URL, drawn in the bottom-right corner of every page
   *  (inside the QR code when `qr` is set). */
  logo?: string;
  /** Optional URL rendered as a QR code in the bottom-right corner of every page */
  qr?: string;
  /** Optional caption shown left of the QR code, followed by an arrow */
  qrLabel?: string;
  /** Precomputed QR modules per side (set by the parser when `qr` is present) */
  qrSize?: number;
  /** Precomputed SVG path of the QR's dark modules (set by the parser) */
  qrPath?: string;
  /** Optional second URL, rendered as a QR code left of the main one */
  qrSecondary?: string;
  /** Optional caption shown under the main QR code, with an arrow up into the secondary one */
  qrSecondaryLabel?: string;
  /** Optional image URL for the centre of the secondary QR code (defaults to `logo`) */
  qrSecondaryLogo?: string;
  /** Precomputed secondary QR modules per side (set by the parser) */
  qrSecondarySize?: number;
  /** Precomputed SVG path of the secondary QR's dark modules (set by the parser) */
  qrSecondaryPath?: string;
  /** Optional document version, printed under the corner QR / logo */
  version?: string;
}

/**
 * Default document configuration
 */
export const DEFAULT_CONFIG: DocumentConfig = {
  format: "A4",
  margins: [20, 20, 20, 20],
};
