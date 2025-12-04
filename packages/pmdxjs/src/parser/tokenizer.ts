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
  | "columns_start"
  | "columns_end"
  | "tag"
  | "heading"
  | "metadata"
  | "divider"
  | "text";

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
  // ---columns 60 40
  columnsStart: /^---columns\s+(\d+)\s+(\d+)\s*$/,
  // ---columns-end
  columnsEnd: /^---columns-end\s*$/,
  // #tag SkillName
  tag: /^#tag\s+(.+)$/,
  // ## Heading or # Heading
  heading: /^(#{1,6})\s+(.+)$/,
  // key: value (for subtitle:, contact:, etc.)
  metadata: /^(\w+):\s*(.+)$/,
  // --- (horizontal rule, but not columns)
  divider: /^---\s*$/,
};

/**
 * Parse entry header: "Company | Role | Dates | Location"
 */
function parseEntryHeader(value: string): {
  company: string;
  role: string;
  dates: string;
  location?: string;
} {
  const parts = value.split("|").map((p) => p.trim());
  return {
    company: parts[0] || "",
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
  context: { inConfig: boolean; inEntry: boolean },
): Token | null {
  const trimmed = line.trim();

  // Empty lines are ignored in tokenization
  if (!trimmed) {
    return null;
  }

  // Check for block end (:::) when inside config or entry
  if (
    (context.inConfig || context.inEntry) &&
    PATTERNS.blockEnd.test(trimmed)
  ) {
    return {
      type: context.inConfig ? "config_end" : "entry_end",
      value: trimmed,
      line: lineNumber,
      column: 1,
    };
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
  const context = { inConfig: false, inEntry: false };

  for (let i = 0; i < lines.length; i++) {
    const token = tokenizeLine(lines[i], i + 1, context);

    if (token) {
      tokens.push(token);

      // Update context
      if (token.type === "config_start") {
        context.inConfig = true;
      } else if (token.type === "config_end") {
        context.inConfig = false;
      } else if (token.type === "entry_start") {
        context.inEntry = true;
      } else if (token.type === "entry_end") {
        context.inEntry = false;
      }
    }
  }

  return tokens;
}
