/**
 * Pure helpers for Czech bank-payment encoding.
 *
 * No Node APIs — safe to run during parse on both server and client.
 */

/**
 * Convert a local Czech account number ("[prefix-]number/bankCode") into an
 * IBAN. Returns the input unchanged if it doesn't look like a CZ account.
 */
export function toIBAN(account: string): string {
  const trimmed = account.trim();
  // Already an IBAN
  if (/^[A-Z]{2}\d{2}/.test(trimmed) && !trimmed.includes("/")) {
    return trimmed.replace(/\s+/g, "");
  }

  const [accPart, bankCode] = trimmed.split("/");
  if (!bankCode) return trimmed;

  const [prefixRaw, numberRaw] = accPart.includes("-")
    ? accPart.split("-")
    : ["", accPart];

  const bank = bankCode.padStart(4, "0");
  const prefix = prefixRaw.padStart(6, "0");
  const number = numberRaw.padStart(10, "0");
  const bban = bank + prefix + number;

  // ISO 7064 mod-97: move "CZ00" to the end, map C->12, Z->35.
  const rearranged = bban + "1235" + "00";
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    remainder = (remainder * 10 + (rearranged.charCodeAt(i) - 48)) % 97;
  }
  const check = String(98 - remainder).padStart(2, "0");
  return `CZ${check}${bban}`;
}

/** Strip diacritics so SPAYD stays within the ASCII-friendly charset. */
function deburr(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\*/g, " ")
    .trim();
}

export interface SPAYDFields {
  /** Account as an IBAN (already normalized). */
  iban: string;
  amount?: string | number;
  currency?: string;
  variableSymbol?: string;
  message?: string;
}

/**
 * Build a SPAYD ("Short Payment Descriptor") string — the Czech "QR Platba"
 * standard understood by every CZ banking app.
 */
export function toSPAYD(fields: SPAYDFields): string {
  const parts = ["SPD*1.0", `ACC:${fields.iban.replace(/\s+/g, "")}`];

  if (fields.amount !== undefined && fields.amount !== "") {
    const amount =
      typeof fields.amount === "number"
        ? fields.amount.toFixed(2)
        : parseAmount(fields.amount).toFixed(2);
    parts.push(`AM:${amount}`);
  }
  parts.push(`CC:${(fields.currency || "CZK").toUpperCase()}`);
  if (fields.variableSymbol) parts.push(`X-VS:${fields.variableSymbol}`);
  if (fields.message) parts.push(`MSG:${deburr(fields.message)}`);

  return parts.join("*");
}

/** Parse a human amount like "1 700 Kč" or "1.700,50" into a number. */
export function parseAmount(value: string): number {
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/\s/g, "")
    // "1.700,50" -> "1700.50"  |  "1,700.50" -> "1700.50"
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}