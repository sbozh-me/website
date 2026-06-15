import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";

import { compile } from "@sbozh/pmdxjs";

export const metadata: Metadata = {
  title: "Faktura 260603001",
  robots: { index: false, follow: false },
};

function getInvoice() {
  const path = join(process.cwd(), "content", "faktura.pmdx");
  return readFileSync(path, "utf-8");
}

export default function InvoicePage() {
  const source = getInvoice();
  const { element, error } = compile(source);

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
      <div className="flex justify-center print:hidden py-6">
        <a
          href="/api/invoice/pdf"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
        >
          Stáhnout PDF
        </a>
      </div>
      <div className="cv-container">{element}</div>
    </div>
  );
}
