import type { Root } from "mdast";
import { mdxBlock, transformFences } from "./remark-fences";

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
 * only renders the block whose `lang` matches the active choice. Unknown language codes
 * are left alone as plain text. Fence rules (nesting, empty blocks) live in remark-fences.
 *
 * The set of languages that have content is reported through `onLanguages` so the
 * switcher only shows tabs that actually have content.
 */

/** Keep in sync with LAW_LANGUAGES in lib/blog/law-languages/languages.ts */
const LANG_CODES = new Set(["cs", "en", "ja", "uk", "ru"]);

export interface RemarkLawLanguagesOptions {
  onLanguages?: (codes: string[]) => void;
}

export default function remarkLawLanguages({ onLanguages }: RemarkLawLanguagesOptions = {}) {
  return (tree: Root) => {
    const present = new Set<string>();
    transformFences(
      tree,
      ({ name, arg }) => name === "lang" && LANG_CODES.has(arg),
      ({ arg }, children) => {
        present.add(arg);
        return mdxBlock("LawLanguageBlock", { lang: arg }, children);
      },
    );
    onLanguages?.([...present]);
  };
}
