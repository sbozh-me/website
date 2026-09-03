/**
 * Token types for PMDXJS syntax
 */
export type TokenType =
  | "config_start"
  | "config_end"
  | "page_start"
  | "page_end"
  | "entry_start"
  | "entry_end"
  | "invoice_start"
  | "invoice_end"
  | "party_start"
  | "party_end"
  | "qr_start"
  | "qr_end"
  | "total_line"
  | "sign_line"
  | "columns_start"
  | "columns_end"
  | "table_row"
  | "table_separator"
  | "tag"
  | "heading"
  | "metadata"
  | "divider"
  | "list_item"
  | "text";

/**
 * Parsing context: which block (if any) we are currently inside. Raw blocks
 * (invoice/party/qr) capture their inner lines verbatim.
 */
export interface TokenizerContext {
  inConfig: boolean;
  inEntry: boolean;
  inInvoice: boolean;
  inParty: boolean;
  inQr: boolean;
}

/**
 * Token produced by the tokenizer
 */
export interface Token {
  type: TokenType;
  value: string;
  meta?: Record<string, string | number | string[]>;
  line: number;
  column: number;
}

/**
 * Regex patterns for PMDXJS syntax
 */
const PATTERNS = {
  // :::config
  configStart: /^:::config\s*$/,
  // ::: (end of block when inside config/entry)
  blockEnd: /^:::\s*$/,
  // :::page
  pageStart: /^:::page\s*$/,
  // :::page-end
  pageEnd: /^:::page-end\s*$/,
  // :::entry Company | Role | Dates | Location
  entryStart: /^:::entry\s+(.+)$/,
  // :::invoice (block of key: value lines)
  invoiceStart: /^:::invoice\s*$/,
  // :::party Dodavatel (block of free-form lines)
  partyStart: /^:::party\s+(.+)$/,
  // :::qr (block of key: value payment fields)
  qrStart: /^:::qr\s*$/,
  // :::total 1 700 Kč  (optionally "amount | label")
  totalLine: /^:::total\s+(.+)$/,
  // :::sign Mgr. Radka Suchá  (name optional)
  signLine: /^:::sign\s*(.*)$/,
  // ---columns 60 40
  columnsStart: /^---columns\s+(\d+)\s+(\d+)\s*$/,
  // ---columns-end
  columnsEnd: /^---columns-end\s*$/,
  // Table row: | cell | cell | cell |
  tableRow: /^\|(.+)\|$/,
  // Table separator: |---|---|---| or |:---|:---:|---:|
  // Must have at least 3 dashes per cell, with optional colons for alignment
  tableSeparator: /^\|([\s:-]*-{3,}[\s:-]*\|)+$/,
  // #tag SkillName
  tag: /^#tag\s+(.+)$/,
  // ## Heading or # Heading
  heading: /^(#{1,6})\s+(.+)$/,
  // key: value (for subtitle:, contact:, etc.)
  metadata: /^(\w+):\s*(.+)$/,
  // key-with-dashes: value (config block only)
  configMetadata: /^([\w-]+):\s*(.+)$/,
  // --- (horizontal rule, but not columns)
  divider: /^---\s*$/,
  // - List item
  listItem: /^-\s+(.+)$/,
};

/**
 * Parse markdown link syntax: [text](url) -> { text, url }
 */
function parseMarkdownLink(value: string): { text: string; url?: string } {
  const linkMatch = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (linkMatch) {
    return { text: linkMatch[1], url: linkMatch[2] };
  }
  return { text: value };
}

/**
 * Parse entry header: "[Company](url) | Role | Dates | Location"
 * Supports markdown link syntax for company name
 */
function parseEntryHeader(value: string): {
  company: string;
  companyUrl?: string;
  role: string;
  dates: string;
  location?: string;
} {
  const parts = value.split("|").map((p) => p.trim());
  const companyParsed = parseMarkdownLink(parts[0] || "");
  return {
    company: companyParsed.text,
    companyUrl: companyParsed.url,
    role: parts[1] || "",
    dates: parts[2] || "",
    location: parts[3],
  };
}

/**
 * Parse contact string: "email | phone | location"
 */
function parseContact(value: string): string[] {
  return value.split("|").map((p) => p.trim());
}

/**
 * Tokenize a single line of PMDXJS content
 */
export function tokenizeLine(
  line: string,
  lineNumber: number,
  context: Partial<TokenizerContext>,
): Token | null {
  const trimmed = line.trim();

  // Empty lines are ignored in tokenization (except raw blocks, which may
  // want to preserve spacing — but invoices don't need that, so skip).
  if (!trimmed) {
    return null;
  }

  // Check for block end (:::) when inside a block directive
  if (PATTERNS.blockEnd.test(trimmed)) {
    if (context.inConfig)
      return { type: "config_end", value: trimmed, line: lineNumber, column: 1 };
    if (context.inEntry)
      return { type: "entry_end", value: trimmed, line: lineNumber, column: 1 };
    if (context.inInvoice)
      return { type: "invoice_end", value: trimmed, line: lineNumber, column: 1 };
    if (context.inParty)
      return { type: "party_end", value: trimmed, line: lineNumber, column: 1 };
    if (context.inQr)
      return { type: "qr_end", value: trimmed, line: lineNumber, column: 1 };
  }

  // Inside a raw block, capture every line verbatim as text
  if (context.inInvoice || context.inParty || context.inQr) {
    return { type: "text", value: trimmed, line: lineNumber, column: 1 };
  }

  // Inside the config block, keys may contain hyphens (e.g. `qr-label:`)
  if (context.inConfig) {
    const configMatch = trimmed.match(PATTERNS.configMetadata);
    if (configMatch) {
      return {
        type: "metadata",
        value: configMatch[2],
        meta: { key: configMatch[1].toLowerCase(), parsedValue: configMatch[2] },
        line: lineNumber,
        column: 1,
      };
    }
  }

  // Config start
  if (PATTERNS.configStart.test(trimmed)) {
    return {
      type: "config_start",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
  }

  // Page start
  if (PATTERNS.pageStart.test(trimmed)) {
    return {
      type: "page_start",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
  }

  // Page end
  if (PATTERNS.pageEnd.test(trimmed)) {
    return {
      type: "page_end",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
  }

  // Entry start
  const entryMatch = trimmed.match(PATTERNS.entryStart);
  if (entryMatch) {
    return {
      type: "entry_start",
      value: trimmed,
      meta: parseEntryHeader(entryMatch[1]),
      line: lineNumber,
      column: 1,
    };
  }

  // Invoice masthead start
  if (PATTERNS.invoiceStart.test(trimmed)) {
    return { type: "invoice_start", value: trimmed, line: lineNumber, column: 1 };
  }

  // Party block start
  const partyMatch = trimmed.match(PATTERNS.partyStart);
  if (partyMatch) {
    return {
      type: "party_start",
      value: trimmed,
      meta: { role: partyMatch[1].trim() },
      line: lineNumber,
      column: 1,
    };
  }

  // QR payment block start
  if (PATTERNS.qrStart.test(trimmed)) {
    return { type: "qr_start", value: trimmed, line: lineNumber, column: 1 };
  }

  // Total line (single-line directive)
  const totalMatch = trimmed.match(PATTERNS.totalLine);
  if (totalMatch) {
    return {
      type: "total_line",
      value: totalMatch[1].trim(),
      line: lineNumber,
      column: 1,
    };
  }

  // Signature line (single-line directive)
  const signMatch = trimmed.match(PATTERNS.signLine);
  if (signMatch) {
    return {
      type: "sign_line",
      value: signMatch[1].trim(),
      line: lineNumber,
      column: 1,
    };
  }

  // Columns start
  const columnsMatch = trimmed.match(PATTERNS.columnsStart);
  if (columnsMatch) {
    return {
      type: "columns_start",
      value: trimmed,
      meta: {
        left: parseInt(columnsMatch[1], 10),
        right: parseInt(columnsMatch[2], 10),
      },
      line: lineNumber,
      column: 1,
    };
  }

  // Columns end
  if (PATTERNS.columnsEnd.test(trimmed)) {
    return {
      type: "columns_end",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
  }

  // Tag
  const tagMatch = trimmed.match(PATTERNS.tag);
  if (tagMatch) {
    return {
      type: "tag",
      value: tagMatch[1],
      line: lineNumber,
      column: 1,
    };
  }

  // Heading
  const headingMatch = trimmed.match(PATTERNS.heading);
  if (headingMatch) {
    return {
      type: "heading",
      value: headingMatch[2],
      meta: { level: headingMatch[1].length },
      line: lineNumber,
      column: 1,
    };
  }

  // Divider (must come after columns check)
  if (PATTERNS.divider.test(trimmed)) {
    return {
      type: "divider",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
  }

  // List item
  const listMatch = trimmed.match(PATTERNS.listItem);
  if (listMatch) {
    return {
      type: "list_item",
      value: listMatch[1],
      line: lineNumber,
      column: 1,
    };
  }

  // Table separator: |---|---|---|
  if (PATTERNS.tableSeparator.test(trimmed)) {
    // Parse alignment from separator (e.g., |:---|:---:|---:|)
    // Remove first | and split by |, filter empty
    const cells = trimmed.split("|").filter((c) => c.trim().length > 0);
    const alignments = cells.map((cell) => {
      const c = cell.trim();
      if (c.startsWith(":") && c.endsWith(":")) return "center";
      if (c.endsWith(":")) return "right";
      return "left";
    });
    return {
      type: "table_separator",
      value: trimmed,
      meta: { alignments },
      line: lineNumber,
      column: 1,
    };
  }

  // Table row: | cell | cell | cell |
  const tableRowMatch = trimmed.match(PATTERNS.tableRow);
  if (tableRowMatch) {
    const cells = tableRowMatch[1].split("|").map((c) => c.trim());
    return {
      type: "table_row",
      value: trimmed,
      meta: { cells },
      line: lineNumber,
      column: 1,
    };
  }

  // Metadata (key: value)
  const metaMatch = trimmed.match(PATTERNS.metadata);
  if (metaMatch) {
    const key = metaMatch[1].toLowerCase();
    let value: string | string[] = metaMatch[2];

    // Parse contact as array
    if (key === "contact") {
      value = parseContact(metaMatch[2]);
    }

    return {
      type: "metadata",
      value: metaMatch[2],
      meta: { key, parsedValue: value },
      line: lineNumber,
      column: 1,
    };
  }

  // Default: plain text
  return {
    type: "text",
    value: line,
    line: lineNumber,
    column: 1,
  };
}

/**
 * Tokenize PMDXJS source into tokens
 */
export function tokenize(source: string): Token[] {
  const lines = source.split("\n");
  const tokens: Token[] = [];
  const context: TokenizerContext = {
    inConfig: false,
    inEntry: false,
    inInvoice: false,
    inParty: false,
    inQr: false,
  };

  for (let i = 0; i < lines.length; i++) {
    const token = tokenizeLine(lines[i], i + 1, context);

    if (token) {
      tokens.push(token);

      // Update context
      switch (token.type) {
        case "config_start":
          context.inConfig = true;
          break;
        case "config_end":
          context.inConfig = false;
          break;
        case "entry_start":
          context.inEntry = true;
          break;
        case "entry_end":
          context.inEntry = false;
          break;
        case "invoice_start":
          context.inInvoice = true;
          break;
        case "invoice_end":
          context.inInvoice = false;
          break;
        case "party_start":
          context.inParty = true;
          break;
        case "party_end":
          context.inParty = false;
          break;
        case "qr_start":
          context.inQr = true;
          break;
        case "qr_end":
          context.inQr = false;
          break;
      }
    }
  }

  return tokens;
}
