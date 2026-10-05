import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";

import { compile } from "@sbozh/pmdxjs";

export const metadata: Metadata = {
  title: "Prohlášení o souhlasu s umístěním místa podnikání",
  robots: { index: false, follow: false },
};

const VARIANTS = {
  official: { file: "sidlo.pmdx", label: "Oficiální" },
  branded: { file: "sidlo-branded.pmdx", label: "Branded" },
} as const;

type Variant = keyof typeof VARIANTS;

function getDeclaration(variant: Variant) {
  const path = join(process.cwd(), "content", VARIANTS[variant].file);
  return readFileSync(path, "utf-8");
}

export default async function SidloPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const variant: Variant = v === "branded" ? "branded" : "official";
  const { element, error } = compile(getDeclaration(variant));

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-destructive">Error</h1>
        <p className="mt-4 text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-6 md:py-12 print:p-0">
      <div className="flex flex-wrap justify-center gap-2 print:hidden py-6">
        {(Object.keys(VARIANTS) as Variant[]).map((key) => (
          <a
            key={key}
            href={key === "official" ? "/sidlo" : `/sidlo?v=${key}`}
            className={
              key === variant
                ? "rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary"
                : "rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {VARIANTS[key].label}
          </a>
        ))}
        <a
          href={`/api/sidlo/pdf?v=${variant}`}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
        >
          Stáhnout PDF
        </a>
      </div>
      <div className="cv-container">{element}</div>
    </div>
  );
}
