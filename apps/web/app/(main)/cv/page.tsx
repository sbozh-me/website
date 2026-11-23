import type { Metadata } from "next";

import { CVPicker } from "@/components/cv/CVPicker";
import { CVView } from "@/components/cv/CVView";
import { resolveCVVariant } from "@/lib/cv/variants";

export const metadata: Metadata = {
  title: "CV",
  description: "Sem Bozhyk's CV in Engineer and Co-Founder cuts, in English and Ukrainian.",
  openGraph: {
    title: "CV | sbozh.me",
    description: "Sem Bozhyk's CV in Engineer and Co-Founder cuts, in English and Ukrainian.",
    type: "profile",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CV | sbozh.me",
    description: "Sem Bozhyk's CV in Engineer and Co-Founder cuts, in English and Ukrainian.",
    images: ["/ogdefault.png"],
  },
};

interface CVPageProps {
  searchParams: Promise<{ role?: string; lang?: string }>;
}

export default async function CVPage({ searchParams }: CVPageProps) {
  const params = await searchParams;
  const variant = resolveCVVariant(params.role, params.lang);
  const pdfUrl = `/api/cv/pdf?role=${variant.role}&lang=${variant.lang}`;

  return (
    <CVView
      file={variant.file}
      title={variant.title}
      pdfUrl={pdfUrl}
      pdfFilename={variant.pdfFilename}
      picker={<CVPicker role={variant.role} lang={variant.lang} />}
    />
  );
}
