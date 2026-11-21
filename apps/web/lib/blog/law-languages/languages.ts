/**
 * The five languages a Law-type post is written in. Order is the order they appear in the
 * switcher. Keep in sync with LANG_CODES in lib/blog/remark-law-languages.ts.
 */
export const LAW_LANGUAGES = [
  { code: "cs", label: "Česky", short: "CZ" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "uk", label: "Українською", short: "UA" },
  { code: "ru", label: "По-русски", short: "RU" },
] as const;

export type LawLanguageCode = (typeof LAW_LANGUAGES)[number]["code"];

export const DEFAULT_LAW_LANGUAGE: LawLanguageCode = "cs";

/** localStorage key used by LawLanguageSwitcher to remember the reader's choice. */
export const LAW_LANGUAGE_STORAGE_KEY = "law-language";

export function isLawLanguage(value: string): value is LawLanguageCode {
  return LAW_LANGUAGES.some((lang) => lang.code === value);
}
