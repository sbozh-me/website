/**
 * The two versions a post can be written in: with AI and without. Order is the order
 * they appear in the switcher; `param` is how the URL names them (`?version=no-ai`).
 * Keep in sync with VARIANTS in lib/blog/remark-ai-variants.ts.
 */
export const AI_VARIANTS = [
  { code: "ai", param: "ai", label: "Written with AI", short: "AI" },
  { code: "nai", param: "no-ai", label: "Written without AI", short: "No AI" },
] as const;

export type AiVariantCode = (typeof AI_VARIANTS)[number]["code"];

export const DEFAULT_AI_VARIANT: AiVariantCode = "ai";

/** localStorage key that remembers the reader's choice. */
export const AI_VARIANT_STORAGE_KEY = "ai-variant";

/** The URL parameter that opens a post on one version: `?version=ai` or `?version=no-ai`. */
export const AI_VARIANT_PARAM = "version";

export function isAiVariant(value: string): value is AiVariantCode {
  return AI_VARIANTS.some((variant) => variant.code === value);
}

/** `?version=…` → the variant it asks for (`no-ai`, `noai` and `nai` all mean No AI). */
export function variantFromParam(value: string | string[] | undefined): AiVariantCode | undefined {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  if (raw === "ai") return "ai";
  if (raw === "no-ai" || raw === "noai" || raw === "nai") return "nai";
  return undefined;
}

export function paramForVariant(code: AiVariantCode): string {
  return AI_VARIANTS.find((variant) => variant.code === code)!.param;
}
