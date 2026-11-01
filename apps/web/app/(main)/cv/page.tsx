import type { Metadata } from "next";

import { CVView } from "@/components/cv/CVView";

export const metadata: Metadata = {
  title: "CV",
  description: "Professional experience and skills of the founder.",
  openGraph: {
    title: "CV | sbozh.me",
    description: "Professional experience and skills of the founder.",
    type: "profile",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "CV | sbozh.me",
    description: "Professional experience and skills of the founder.",
    images: ["/ogdefault.png"],
  },
};

export default function CVPage() {
  return <CVView file="sem-bozhyk-v0.0.1.pmdx" title="Founder's CV" />;
}
