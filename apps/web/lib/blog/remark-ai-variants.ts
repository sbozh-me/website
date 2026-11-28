import type { Root } from "mdast";
import { mdxBlock, transformFences } from "./remark-fences";

/**
 * A post written twice, once with AI and once without:
 *
 *   :::ai
 *   The version written with AI...
 *   :::
 *
 *   :::nai
 *   The version written without AI...
 *   :::
 *
 * Each block becomes `<AiVariantBlock variant="ai|nai">…</AiVariantBlock>`; the switcher
 * above the article shows one of them at a time. Text outside the blocks shows in both.
 * The blocks may hold `:::lang` blocks and the other way around (see remark-fences).
 *
 * The variants that have content are reported through `onVariants`, so the switcher only
 * offers what the post actually contains.
 */

/** Keep in sync with AI_VARIANTS in lib/blog/ai-variants/variants.ts */
const VARIANTS = new Set(["ai", "nai"]);

export interface RemarkAiVariantsOptions {
  onVariants?: (variants: string[]) => void;
}

export default function remarkAiVariants({ onVariants }: RemarkAiVariantsOptions = {}) {
  return (tree: Root) => {
    const present = new Set<string>();
    transformFences(
      tree,
      ({ name, arg }) => VARIANTS.has(name) && arg === "",
      ({ name }, children) => {
        present.add(name);
        return mdxBlock("AiVariantBlock", { variant: name }, children);
      },
    );
    onVariants?.([...present]);
  };
}
