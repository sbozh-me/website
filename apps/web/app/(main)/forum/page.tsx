import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forum",
  description: "The Forum is on pause.",
  robots: { index: false, follow: false },
};

export default function ForumPage() {
  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
      <div className="max-w-xl mx-auto text-center">
        <h1 className="tracking-tight">Forum</h1>
        <p className="mt-6 text-muted-foreground">TBD</p>
      </div>
    </div>
  );
}
