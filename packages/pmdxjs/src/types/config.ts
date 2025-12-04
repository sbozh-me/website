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
}

/**
 * Default document configuration
 */
export const DEFAULT_CONFIG: DocumentConfig = {
  format: "A4",
  margins: [20, 20, 20, 20],
};
