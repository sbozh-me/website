"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@sbozh/react-ui/components/ui/button";

import type { CVLang, CVRole } from "@/lib/cv/variants";
import { CV_LANGS, CV_ROLES, DEFAULT_LANG, DEFAULT_ROLE } from "@/lib/cv/variants";

interface CVPickerProps {
  role: CVRole;
  lang: CVLang;
}

const ROLE_LABELS: Record<CVRole, string> = {
  engineer: "Engineer",
  founder: "Co-Founder",
};

const LANG_LABELS: Record<CVLang, string> = {
  en: "EN",
  uk: "UK",
};

const STORAGE_KEY = "cv-preference";

export function CVPicker({ role, lang }: CVPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // On first visit with no URL params, follow the reader's saved preference
  useEffect(() => {
    if (searchParams.get("role") || searchParams.get("lang")) return;
    const saved = readSaved();
    if (!saved) return;
    if (saved.role === DEFAULT_ROLE && saved.lang === DEFAULT_LANG) return;
    router.replace(buildHref(pathname, saved.role, saved.lang));
  }, [pathname, router, searchParams]);

  const update = (next: { role?: CVRole; lang?: CVLang }) => {
    const nextRole = next.role ?? role;
    const nextLang = next.lang ?? lang;
    writeSaved(nextRole, nextLang);
    router.replace(buildHref(pathname, nextRole, nextLang));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 print:hidden" data-cv-picker>
      <Group label="Role">
        {CV_ROLES.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={role === option ? "default" : "outline"}
            aria-pressed={role === option}
            onClick={() => update({ role: option })}
          >
            {ROLE_LABELS[option]}
          </Button>
        ))}
      </Group>
      <Group label="Language">
        {CV_LANGS.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={lang === option ? "default" : "outline"}
            aria-pressed={lang === option}
            onClick={() => update({ lang: option })}
          >
            {LANG_LABELS[option]}
          </Button>
        ))}
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

function buildHref(pathname: string, role: CVRole, lang: CVLang) {
  const params = new URLSearchParams();
  if (role !== DEFAULT_ROLE) params.set("role", role);
  if (lang !== DEFAULT_LANG) params.set("lang", lang);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function readSaved(): { role: CVRole; lang: CVLang } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string; lang?: string };
    const role = (CV_ROLES as readonly string[]).includes(parsed.role ?? "") ? (parsed.role as CVRole) : DEFAULT_ROLE;
    const lang = (CV_LANGS as readonly string[]).includes(parsed.lang ?? "") ? (parsed.lang as CVLang) : DEFAULT_LANG;
    return { role, lang };
  } catch {
    return null;
  }
}

function writeSaved(role: CVRole, lang: CVLang) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, lang }));
  } catch {
    // Storage denied (private mode, quota, disabled): the URL still carries the choice
  }
}
