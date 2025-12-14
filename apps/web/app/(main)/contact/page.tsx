import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me",
};

export default function ContactPage() {
  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Contact</h1>
        <p className="mt-6 text-muted-foreground">
          Under construction. In the meantime, reach me through{" "}
          <Link
            href="/projects/discord-community"
            className="text-primary hover:underline"
          >
            Discord
          </Link>{" "}
          or write me at{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary hover:underline"
          >
            {contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
