import type { ReactNode } from "react";
import { ErrorState } from "@sbozh/release-notes/components";
import { ReleaseTimelineWithLoadMore } from "./ReleaseTimelineWithLoadMore";
import type { ReleaseListItem } from "@sbozh/release-notes/types";

type ReleasesResult =
  | { success: true; releases: ReleaseListItem[]; summaries: Record<string, ReactNode>; hasMore: boolean; currentVersion: string }
  | { success: false; error: string; status?: number };

interface ReleaseNotesTabProps {
  data: ReleasesResult;
  projectSlug: string;
}

export function ReleaseNotesTab({ data, projectSlug }: ReleaseNotesTabProps) {
  if (!data.success) {
    return <ErrorState message={data.error} status={data.status} />;
  }

  if (data.releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No release notes available yet.</p>
      </div>
    );
  }

  return (
    <ReleaseTimelineWithLoadMore
      initialReleases={data.releases}
      initialSummaries={data.summaries}
      initialHasMore={data.hasMore}
      currentVersion={data.currentVersion}
      projectSlug={projectSlug}
    />
  );
}
