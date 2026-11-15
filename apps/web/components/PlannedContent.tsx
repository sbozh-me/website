import Link from "next/link";
import { CalendarClock } from "lucide-react";

import { formatShortDate } from "@sbozh/blog/utils";
import { Button } from "@sbozh/react-ui/components/ui/button";

/** Stands in for a planned post's body until its publish time */
export function PlannedContent({ date }: { readonly date: string }) {
  return (
    <div className="not-prose my-12 flex flex-col items-center gap-4 rounded-lg border border-dashed border-secondary/50 bg-card/40 px-6 py-10 text-center">
      <CalendarClock className="size-8 text-secondary" aria-hidden="true" />
      <div>
        <p className="text-lg font-medium">
          Comes out <time dateTime={date}>{formatShortDate(date)}</time>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscribe and it reaches your inbox the moment it&apos;s out.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/subscribe">Keep me posted</Link>
      </Button>
    </div>
  );
}
