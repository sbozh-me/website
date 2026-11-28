/**
 * The two versions a post can be written in: with AI and without. Order is the order
 * they appear in the switcher. Keep in sync with VARIANTS in lib/blog/remark-ai-variants.ts.
 */
export const AI_VARIANTS = [
  { code: "ai", label: "Written with AI", short: "AI" },
  { code: "nai", label: "Written without AI", short: "No AI" },
] as const;

export type AiVariantCode = (typeof AI_VARIANTS)[number]["code"];

export const DEFAULT_AI_VARIANT: AiVariantCode = "ai";

/** localStorage key that remembers the reader's choice. */
export const AI_VARIANT_STORAGE_KEY = "ai-variant";

export function isAiVariant(value: string): value is AiVariantCode {
  return AI_VARIANTS.some((variant) => variant.code === value);
}
