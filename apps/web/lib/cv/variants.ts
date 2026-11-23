export const CV_ROLES = ["engineer", "founder"] as const;
export const CV_LANGS = ["en", "uk"] as const;

export type CVRole = (typeof CV_ROLES)[number];
export type CVLang = (typeof CV_LANGS)[number];

export const DEFAULT_ROLE: CVRole = "engineer";
export const DEFAULT_LANG: CVLang = "en";

interface CVVariant {
  role: CVRole;
  lang: CVLang;
  file: string;
  title: string;
  pdfFilename: string;
}

const VARIANTS: readonly CVVariant[] = [
  {
    role: "engineer",
    lang: "en",
    file: "cv-engineer-en.pmdx",
    title: "Sem Bozhyk's CV",
    pdfFilename: "CV_Sem_Bozhyk_Software_Engineer.pdf",
  },
  {
    role: "engineer",
    lang: "uk",
    file: "cv-engineer-ua.pmdx",
    title: "CV Семена Божика",
    pdfFilename: "CV_Sem_Bozhyk_Software_Engineer_UA.pdf",
  },
  {
    role: "founder",
    lang: "en",
    file: "cv-founder-en.pmdx",
    title: "Semen Bozhyk's CV",
    pdfFilename: "CV_Semen_Bozhyk_Co_Founder.pdf",
  },
  {
    role: "founder",
    lang: "uk",
    file: "cv-founder-ua.pmdx",
    title: "CV Семена Божика",
    pdfFilename: "CV_Semen_Bozhyk_Co_Founder_UA.pdf",
  },
];

export function resolveCVVariant(roleParam: string | undefined, langParam: string | undefined): CVVariant {
  const role = (CV_ROLES as readonly string[]).includes(roleParam ?? "")
    ? (roleParam as CVRole)
    : DEFAULT_ROLE;
  const lang = (CV_LANGS as readonly string[]).includes(langParam ?? "")
    ? (langParam as CVLang)
    : DEFAULT_LANG;
  // One per (role, lang) — the find never misses
  return VARIANTS.find((v) => v.role === role && v.lang === lang)!;
}
