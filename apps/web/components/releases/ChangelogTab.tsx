import { VerticalTimeline } from "@sbozh/react-ui/components/ui/vertical-timeline";
import type { TimelineData } from "@sbozh/react-ui/components/ui/vertical-timeline";

interface ChangelogTabProps {
  data: TimelineData | null;
}

export function ChangelogTab({ data }: ChangelogTabProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive">Failed to load changelog</p>
      </div>
    );
  }

  if (data.groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No changelog entries available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <VerticalTimeline data={data} />
    </div>
  );
}
