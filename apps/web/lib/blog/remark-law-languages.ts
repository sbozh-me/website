import type { BlockContent, Paragraph, Root, RootContent } from "mdast";
import type { MdxJsxAttribute, MdxJsxFlowElement } from "mdast-util-mdx-jsx";

/**
 * Remark plugin for the Law-type post language blocks:
 *
 *   :::lang cs
 *   Český text zákona...
 *   :::
 *
 *   :::lang en
 *   English version...
 *   :::
 *
 * Each `:::lang xx` ... `:::` fence becomes an `<LawLanguageBlock lang="xx">...</LawLanguageBlock>`
 * JSX element whose children are the mdast nodes between the fences. The client component
 * only renders the block whose `lang` matches the active choice.
 *
 * Openers and closers must be their own paragraphs (blank lines around them), so markdown
 * inside the block parses normally. Unknown language codes are left alone as plain text.
 *
 * Empty blocks (no children between opener and closer) are dropped and never emit a JSX
 * element; this is the `:::*` rule that an empty block does not take up UI space. The set
 * of languages that remain is reported through `onLanguages` so the switcher only shows
 * tabs that actually have content.
 *
 * PMDX reserves `:::config`, `:::page`, `:::page-end`, `:::entry`, `:::invoice`, `:::party`,
 * `:::qr`, `:::total`, `:::link-qr`, `:::sign`, `:::field` — they are parsed inside a
 * `<PMDX source="…" />` prop string, so they don't collide at this layer, but future
 * `:::<name>` extensions for blog posts (e.g. `:::meanings`, `:::UPD`) should steer clear
 * of those names so one author can use both at the same time.
 */

/** Keep in sync with LAW_LANGUAGES in lib/blog/law-languages/languages.ts */
const LANG_CODES = new Set(["cs", "en", "ja", "uk", "ru"]);
const OPENER = /^:::\s*lang\s+([a-z]{2})\s*$/;
const CLOSER = /^:::\s*$/;

export interface RemarkLawLanguagesOptions {
  onLanguages?: (codes: string[]) => void;
}

export default function remarkLawLanguages({ onLanguages }: RemarkLawLanguagesOptions = {}) {
  return (tree: Root) => {
    const present = new Set<string>();
    transformChildren(tree, present);
    onLanguages?.([...present]);
  };
}

function transformChildren(parent: Root, present: Set<string>) {
  const next: RootContent[] = [];
  const children = parent.children;
  let i = 0;

  while (i < children.length) {
    const node = children[i];
    const opener = matchOpener(node);

    if (!opener) {
      next.push(node);
      i += 1;
      continue;
    }

    // Look ahead for the matching closer at the same level.
    let close = -1;
    for (let j = i + 1; j < children.length; j += 1) {
      if (matchCloser(children[j])) {
        close = j;
        break;
      }
      // A second opener before a closer means the first one is unmatched; bail out.
      if (matchOpener(children[j])) {
        break;
      }
    }

    if (close === -1) {
      next.push(node);
      i += 1;
      continue;
    }

    const inner = children.slice(i + 1, close) as BlockContent[];
    // An empty :::lang block takes no UI space and is not reported as present.
    if (inner.length > 0) {
      present.add(opener);
      next.push(wrap(opener, inner));
    }
    i = close + 1;
  }

  parent.children = next;
}

function matchOpener(node: RootContent): string | null {
  const text = paragraphText(node);
  if (text === null) return null;
  const m = OPENER.exec(text);
  if (!m) return null;
  const code = m[1];
  if (!LANG_CODES.has(code)) return null;
  return code;
}

function matchCloser(node: RootContent): boolean {
  const text = paragraphText(node);
  return text !== null && CLOSER.test(text);
}

function paragraphText(node: RootContent): string | null {
  if (node.type !== "paragraph") return null;
  const p = node as Paragraph;
  if (p.children.length !== 1) return null;
  const child = p.children[0];
  if (child.type !== "text") return null;
  return child.value.trim();
}

function wrap(lang: string, children: BlockContent[]): MdxJsxFlowElement {
  const attr: MdxJsxAttribute = { type: "mdxJsxAttribute", name: "lang", value: lang };
  return {
    type: "mdxJsxFlowElement",
    name: "LawLanguageBlock",
    attributes: [attr],
    children,
  };
}
