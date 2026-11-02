import type { Metadata } from "next";

import { CVView } from "@/components/cv/CVView";

export const metadata: Metadata = {
  title: "Sem Bozhyk CV",
  description: "Professional experience and skills of Sem Bozhyk, the founder.",
  openGraph: {
    title: "Sem Bozhyk CV | sbozh.me",
    description: "Professional experience and skills of Sem Bozhyk, the founder.",
    type: "profile",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sem Bozhyk CV | sbozh.me",
    description: "Professional experience and skills of Sem Bozhyk, the founder.",
    images: ["/ogdefault.png"],
  },
};

export default function CVPage() {
  return <CVView file="sem-bozhyk-v0.0.1.pmdx" title="Sem Bozhyk's CV" />;
}
