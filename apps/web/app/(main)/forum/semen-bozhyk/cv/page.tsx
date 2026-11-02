import type { Metadata } from "next";

import { CVView } from "@/components/cv/CVView";

export const metadata: Metadata = {
  title: "Semen Bozhyk CV",
  description: "Builder and creator. Ventures, works and avatars of Semen Bozhyk.",
  robots: { index: false, follow: false },
};

export default function SemenCVPage() {
  return (
    <CVView
      file="semen-bozhyk-v0.0.1.pmdx"
      title="Builder's CV"
      pdfUrl="/api/cv/pdf?v=semen"
      pdfFilename="CV_Semen_Bozhyk_Builder_and_Creator.pdf"
    />
  );
}
