import { RoadmapView } from "@/components/roadmap/RoadmapView";
import type { TimelineData } from "@sbozh/react-ui/components/ui/vertical-timeline";

type RoadmapData = {
  roadmapData: TimelineData;
  backlogData: TimelineData;
  completedCount: number;
  totalCount: number;
  currentVersion: string;
} | null;

interface RoadmapTabProps {
  data: RoadmapData;
}

export function RoadmapTab({ data }: RoadmapTabProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive">Failed to load roadmap</p>
      </div>
    );
  }

  if (
    (!data.roadmapData.groups || data.roadmapData.groups.length === 0) &&
    (!data.backlogData.groups || data.backlogData.groups.length === 0)
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No roadmap items available yet.</p>
      </div>
    );
  }

  return (
    <RoadmapView
      roadmapData={data.roadmapData}
      backlogData={data.backlogData}
      completedCount={data.completedCount}
      totalCount={data.totalCount}
      currentVersion={data.currentVersion}
    />
  );
}
