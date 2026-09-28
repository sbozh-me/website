import type { Nodes, Parent, PhrasingContent, Root, Text } from "mdast";
import type { MdxJsxAttribute, MdxJsxTextElement } from "mdast-util-mdx-jsx";

/**
 * Remark plugin for the blog's glitch syntax (see .claude/specs/blog-glitch-syntax.md):
 *
 *   (;)                 -> <Censor />                  the ✳ logo replaces a letter
 *   ==D(;)ck pitch==    -> <DickPitch />               two-tone brand mark
 *   ==base|alt==        -> <Glitch><GlitchState>…      word glitches into a second meaning
 *   ==a|b|c==           -> <Glitch> with three states
 *   ==base|alt!==       -> <Glitch blink>              blinks repeatedly
 *   ==LOL|No||yes==     -> <GlitchState plain>         `||` state looks like the article text
 *   ==||yes|No==        -> plain base: reads as normal text until it glitches
 *   ==себя|teal:US==    -> <GlitchState color="teal">  gold/purple/teal/white/red/pink picks a colour
 *   [==a|b==](url)      -> <GlitchState link>          linked states: teal, big overhanging underline
 *   ==a|[b](url)==      -> only the state holding the link is a link
 *   ===a|b===           -> <Glitch unclosable>         keeps glitching with the window OFF
 *   ==WINDOW==          -> <WindowToggle />            "Window ON/OFF" button; OFF = no glitches
 *   ==WINDOW OFF==      -> <WindowToggle off />        same button, but the page starts with it OFF
 *   ==text==            -> <mark>                      plain Obsidian highlight
 *
 * Works on the mdast (not the raw string), so code, inline code and URLs are never touched.
 * `==` pairs across sibling inline nodes, so states may contain ~~strike~~, **bold**, etc.
 * `\=`, `\|`, `\!` and `\(` opt a character out of the syntax.
 */

// `==` or `===` (the unclosable kind), never part of a longer run of `=`
const MARK = /(?<!=)(===|==)(?!=)/;
const UNCLOSABLE = "===";
const CENSOR = "(;)";
const BRAND = /^d\(;\)ck\s+pitch$/i;
/** `==WINDOW==` / `==WINDOW OFF==` (exactly, in capitals): the switch that turns the glitches off. */
const WINDOW = "WINDOW";
const WINDOW_OFF = "WINDOW OFF";
/** `teal:Window` picks a state's colour (see GLITCH_COLORS in glitch/glitch.tsx). */
const COLOR_PREFIX = /^(gold|purple|teal|white|red|pink):\s*/i;

// Escaped syntax characters are swapped for private-use placeholders while the
// transform runs, then restored, so `\|` stays a literal pipe.
const PLACEHOLDERS: Record<string, string> = {
  "=": "",
  "|": "",
  "!": "",
  "(": "",
};
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;

type Token =
  | { kind: "node"; node: PhrasingContent }
  | { kind: "mark"; marker: string; canOpen: boolean; canClose: boolean };

interface SourceFile {
  value?: unknown;
}

export default function remarkGlitch() {
  return (tree: Root, file?: SourceFile) => {
    const source = typeof file?.value === "string" ? file.value : undefined;
    if (source) visitText(tree, (node) => encodeEscapes(node, source));
    transformHighlights(tree);
    transformCensors(tree);
    markWindowOff(tree);
    visitText(tree, decodeEscapes);
  };
}

function hasChildren(node: Nodes): node is Nodes & Parent {
  return "children" in node && Array.isArray(node.children);
}

function visitText(node: Nodes, fn: (text: Text) => void) {
  if (node.type === "text") fn(node);
  else if (hasChildren(node)) node.children.forEach((child) => visitText(child as Nodes, fn));
}

function visitJsx(node: Nodes, fn: (element: MdxJsxTextElement) => void) {
  if (node.type === "mdxJsxTextElement") fn(node);
  if (hasChildren(node)) node.children.forEach((child) => visitJsx(child as Nodes, fn));
}

/**
 * A post with `==WINDOW OFF==` starts with the glitches off. Every glitch word gets
 * `windowOff` so the server already renders it plain (no flash before hydration).
 */
function markWindowOff(tree: Root) {
  let off = false;
  visitJsx(tree, (element) => {
    if (element.name === "WindowToggle" && element.attributes.some((a) => "name" in a && a.name === "off")) off = true;
  });
  if (!off) return;
  visitJsx(tree, (element) => {
    if (element.name === "Glitch" || element.name === "DickPitch") element.attributes.push(attribute("windowOff"));
  });
}

function encodeEscapes(node: Text, source: string) {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) return;

  const raw = source.slice(start, end);
  let decoded = "";
  let encoded = "";
  for (let i = 0; i < raw.length; i++) {
    const next = raw[i + 1];
    if (raw[i] === "\\" && next && ASCII_PUNCTUATION.test(next)) {
      decoded += next;
      encoded += PLACEHOLDERS[next] ?? next;
      i++;
    } else {
      decoded += raw[i];
      encoded += raw[i];
    }
  }
  // Raw source doesn't map 1:1 onto the value (e.g. blockquote prefixes,
  // character references): leave the node alone rather than guess.
  if (decoded === node.value) node.value = encoded;
}

function decodeEscapes(node: Text) {
  for (const [char, placeholder] of Object.entries(PLACEHOLDERS)) {
    node.value = node.value.replaceAll(placeholder, char);
  }
}

// ---------------------------------------------------------------------------
// ==…== highlights
// ---------------------------------------------------------------------------

function transformHighlights(node: Nodes) {
  if (!hasChildren(node)) return;
  node.children.forEach((child) => transformHighlights(child as Nodes));

  const children = node.children as PhrasingContent[];
  if (!children.some((child) => child.type === "text" && MARK.test(child.value))) return;
  // `[==a|b==](url)`: every state of a glitch inside a link is a link
  const inLink = node.type === "link" || node.type === "linkReference";
  node.children = pairMarks(tokenize(children), inLink);
}

function tokenize(children: PhrasingContent[]): Token[] {
  const tokens: Token[] = [];
  for (const child of children) {
    if (child.type !== "text") {
      tokens.push({ kind: "node", node: child });
      continue;
    }
    // The capture group keeps the markers: text, marker, text, marker, …
    child.value.split(MARK).forEach((part, index) => {
      if (index % 2 === 1) tokens.push({ kind: "mark", marker: part, canOpen: false, canClose: false });
      else if (part) tokens.push({ kind: "node", node: text(part) });
    });
  }

  // Flanking like ~~strike~~: an opener hugs the text after it, a closer the text before it.
  tokens.forEach((token, index) => {
    if (token.kind !== "mark") return;
    const prev = tokens[index - 1];
    const next = tokens[index + 1];
    token.canOpen = next?.kind === "node" && !startsWithSpace(next.node);
    token.canClose = prev?.kind === "node" && !endsWithSpace(prev.node);
  });
  return tokens;
}

function pairMarks(tokens: Token[], inLink: boolean): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  // Where the open marker sits in `out`, and whether it was `==` or `===`
  let open: { at: number; marker: string } | null = null;

  for (const token of tokens) {
    if (token.kind === "node") {
      out.push(token.node);
    } else if (!open) {
      if (token.canOpen) open = { at: out.length, marker: token.marker };
      else out.push(text(token.marker));
    } else if (token.canClose && token.marker === open.marker) {
      const inner = out.splice(open.at);
      const built = buildHighlight(inner, inLink, open.marker === UNCLOSABLE);
      out.push(...(built ?? [text(open.marker), ...inner, text(open.marker)]));
      open = null;
    } else if (token.canOpen) {
      out.splice(open.at, 0, text(open.marker));
      open = { at: out.length, marker: token.marker };
    } else {
      out.push(text(token.marker));
    }
  }
  if (open) out.splice(open.at, 0, text(open.marker));

  return mergeText(out);
}

interface State {
  nodes: PhrasingContent[];
  /** Came after `||`: shown in the article's own font and colour. */
  plain: boolean;
  color?: string;
}

function buildHighlight(
  inner: PhrasingContent[],
  inLink: boolean,
  unclosable = false,
): PhrasingContent[] | null {
  const states = splitStates(inner);
  states.forEach((state) => (state.nodes = trimState(state.nodes)));
  // A leading `||` makes the base itself plain: `==||yes|No==`
  if (states.length > 2 && states[0].nodes.length === 0 && states[1].plain) states.shift();
  if (states.some((state) => state.nodes.length === 0)) return null;

  if (states.length === 1) {
    const plainText = toPlainText(states[0].nodes).trim();
    if (BRAND.test(plainText)) return [jsx("DickPitch", [], unclosable ? [attribute("unclosable")] : [])];
    if (plainText === WINDOW) return [jsx("WindowToggle")];
    if (plainText === WINDOW_OFF) return [jsx("WindowToggle", [], [attribute("off")])];
    return [jsx("mark", states[0].nodes)];
  }

  const last = states[states.length - 1];
  const tail = last.nodes[last.nodes.length - 1];
  const blink = tail.type === "text" && tail.value.endsWith("!");
  if (blink) {
    tail.value = tail.value.slice(0, -1);
    last.nodes = trimState(last.nodes);
  }

  for (const state of states) {
    const head = state.nodes[0];
    if (head?.type !== "text") continue;
    const match = COLOR_PREFIX.exec(head.value);
    if (!match) continue;
    state.color = match[1].toLowerCase();
    state.nodes = trimState([text(head.value.slice(match[0].length)), ...state.nodes.slice(1)]);
  }
  if (states.some((state) => state.nodes.length === 0)) return null;

  return [
    jsx(
      "Glitch",
      states.map(({ nodes, plain, color }) =>
        jsx("GlitchState", nodes, [
          ...(color ? [attribute("color", color)] : []),
          ...(plain ? [attribute("plain")] : []),
          ...(inLink || nodes.some(isLink) ? [attribute("link")] : []),
        ]),
      ),
      [...(blink ? [attribute("blink")] : []), ...(unclosable ? [attribute("unclosable")] : [])],
    ),
  ];
}

function splitStates(inner: PhrasingContent[]): State[] {
  const states: State[] = [{ nodes: [], plain: false }];
  for (const node of inner) {
    if (node.type !== "text") {
      states[states.length - 1].nodes.push(node);
      continue;
    }
    // `||` starts a plain state, `|` a glitched one
    node.value.split(/(\|\|?)/).forEach((part, index) => {
      if (index % 2 === 1) states.push({ nodes: [], plain: part === "||" });
      else if (part) states[states.length - 1].nodes.push(text(part));
    });
  }
  return states;
}

function trimState(state: PhrasingContent[]): PhrasingContent[] {
  const nodes = [...state];
  const first = nodes[0];
  if (first?.type === "text") nodes[0] = text(first.value.trimStart());
  const last = nodes[nodes.length - 1];
  if (last?.type === "text") nodes[nodes.length - 1] = text(last.value.trimEnd());
  return nodes.filter((node) => node.type !== "text" || node.value !== "");
}

// ---------------------------------------------------------------------------
// (;) censor
// ---------------------------------------------------------------------------

function transformCensors(node: Nodes) {
  if (!hasChildren(node)) return;
  node.children.forEach((child) => transformCensors(child as Nodes));

  const children = node.children as PhrasingContent[];
  if (!children.some((child) => child.type === "text" && child.value.includes(CENSOR))) return;

  node.children = children.flatMap((child) => {
    if (child.type !== "text" || !child.value.includes(CENSOR)) return [child];
    return child.value.split(CENSOR).flatMap((part, index) => {
      const nodes: PhrasingContent[] = index > 0 ? [jsx("Censor")] : [];
      if (part) nodes.push(text(part));
      return nodes;
    });
  });
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function text(value: string): Text {
  return { type: "text", value };
}

function jsx(
  name: string,
  children: PhrasingContent[] = [],
  attributes: MdxJsxAttribute[] = [],
): MdxJsxTextElement {
  return { type: "mdxJsxTextElement", name, attributes, children };
}

function isLink(node: PhrasingContent) {
  return node.type === "link" || node.type === "linkReference";
}

/** JSX attribute; without a value it's a boolean `name` (true). */
function attribute(name: string, value: string | null = null): MdxJsxAttribute {
  return { type: "mdxJsxAttribute", name, value };
}

function startsWithSpace(node: PhrasingContent) {
  return node.type === "text" && /^\s/.test(node.value);
}

function endsWithSpace(node: PhrasingContent) {
  return node.type === "text" && /\s$/.test(node.value);
}

function mergeText(nodes: PhrasingContent[]): PhrasingContent[] {
  const merged: PhrasingContent[] = [];
  for (const node of nodes) {
    const prev = merged[merged.length - 1];
    if (node.type === "text" && prev?.type === "text") {
      merged[merged.length - 1] = text(prev.value + node.value);
    } else {
      merged.push(node);
    }
  }
  return merged;
}

function toPlainText(nodes: PhrasingContent[]): string {
  return nodes
    .map((node) => {
      if ("value" in node && typeof node.value === "string") return node.value;
      if ("children" in node) return toPlainText(node.children as PhrasingContent[]);
      return "";
    })
    .join("");
}
