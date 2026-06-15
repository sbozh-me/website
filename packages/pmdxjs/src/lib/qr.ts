/**
 * QR matrix encoding via qrcode's pure core (no `fs`, browser-safe).
 *
 * We encode at parse time and emit a single SVG path string so the React
 * component stays a trivial, dependency-free renderer.
 */
// The default `qrcode` entry pulls in `fs`; the core module is pure.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for the core subpath
import QRCodeCore from "qrcode/lib/core/qrcode.js";

export interface QrMatrix {
  /** Number of modules per side. */
  size: number;
  /** SVG path covering every dark module, in a `0 0 size size` viewBox. */
  path: string;
}

interface QrSymbol {
  modules: { size: number; data: ArrayLike<number> };
}

/**
 * Encode `text` into an SVG path of unit squares (one per dark module).
 */
export function encodeQrPath(
  text: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M",
): QrMatrix {
  const symbol = (
    QRCodeCore as { create(t: string, o: object): QrSymbol }
  ).create(text, { errorCorrectionLevel });

  const { size, data } = symbol.modules;
  let path = "";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (data[row * size + col]) {
        path += `M${col} ${row}h1v1h-1z`;
      }
    }
  }
  return { size, path };
}