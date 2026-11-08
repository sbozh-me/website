/**
 * Text edits behind the editor toolbar. Each takes the text and the selection and returns
 * the range to replace, its replacement, and the selection afterwards, so the editor can
 * apply it through the browser's own undo stack.
 */

export interface Selection {
  readonly start: number;
  readonly end: number;
}

export interface Edit {
  /** Range of the original text to replace */
  readonly from: number;
  readonly to: number;
  readonly insert: string;
  /** Selection after the edit, in the new text */
  readonly select: Selection;
}

/** Wraps the selection, or a placeholder that ends up selected: **bold**, `code`, ==a|b==. */
export function wrap(
  text: string,
  { start, end }: Selection,
  before: string,
  after: string,
  placeholder: string,
): Edit {
  const selected = text.slice(start, end);
  // Already wrapped: unwrap, so the button toggles
  if (
    selected &&
    text.slice(start - before.length, start) === before &&
    text.slice(end, end + after.length) === after
  ) {
    const from = start - before.length;
    return { from, insert: selected, select: { end: from + selected.length, start: from }, to: end + after.length };
  }
  const inner = selected || placeholder;
  const at = start + before.length;
  return { from: start, insert: before + inner + after, select: { end: at + inner.length, start: at }, to: end };
}

const BLOCK_MARKER = /^(#{1,6} |> |- )/;

/** Start and end of the whole lines the selection touches. */
export function lineRange(text: string, { start, end }: Selection): Selection {
  const from = text.lastIndexOf("\n", start - 1) + 1;
  const next = text.indexOf("\n", end > start && text[end - 1] === "\n" ? end - 1 : end);
  return { end: next === -1 ? text.length : next, start: from };
}

/** Adds a prefix to every touched line (`## `, `> `, `- `), or removes it if all have it. */
export function prefixLines(text: string, selection: Selection, prefix: string): Edit {
  const range = lineRange(text, selection);
  const lines = text.slice(range.start, range.end).split("\n");
  const all = lines.every((line) => line.startsWith(prefix));
  // A heading, quote or list item is one of them: switching replaces the old marker
  const insert = lines
    .map((line) => (all ? line.slice(prefix.length) : prefix + line.replace(BLOCK_MARKER, "")))
    .join("\n");
  return { from: range.start, insert, select: { end: range.start + insert.length, start: range.start }, to: range.end };
}

/** [text](https://), with the URL selected to type over. */
export function link(text: string, { start, end }: Selection): Edit {
  const label = text.slice(start, end) || "text";
  const url = "https://";
  const at = start + label.length + 3;
  return { from: start, insert: `[${label}](${url})`, select: { end: at + url.length, start: at }, to: end };
}

/** A Voice block around the touched lines, on lines of its own. */
export function voice(text: string, selection: Selection, color = "teal"): Edit {
  const lines = lineRange(text, selection);
  // On an empty line, start a fresh block; otherwise wrap the lines the selection touches
  const range = text.slice(lines.start, lines.end).trim() ? lines : selection;
  const inner = text.slice(range.start, range.end) || "— Their lines.";
  const open = `<Voice color="${color}">\n\n`;
  const insert = `${open}${inner}\n\n</Voice>`;
  const at = range.start + open.length;
  return { from: range.start, insert, select: { end: at + inner.length, start: at }, to: range.end };
}

/** 1-based line of a caret offset. */
export function lineAt(text: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset && index < text.length; index++) if (text[index] === "\n") line++;
  return line;
}
