"use client";

import { useState } from "react";
import { VerticalTimeline } from "@sbozh/react-ui/components/ui/vertical-timeline";
import type { TimelineData } from "@sbozh/react-ui/components/ui/vertical-timeline";

interface RoadmapViewProps {
  roadmapData: TimelineData;
  backlogData: TimelineData;
  completedCount: number;
  totalCount: number;
  currentVersion?: string;
}

type TabType = "actual" | "backlog";

function findCurrentVersionGroup(groups: TimelineData["groups"], version?: string): string | undefined {
  if (!version) return groups.find((g) => !g.completed)?.id;

  const minorVersion = version.split(".").slice(0, 2).join(".");
  const matchingGroup = groups.find((g) => g.label.startsWith(minorVersion));

  return matchingGroup?.id ?? groups.find((g) => !g.completed)?.id;
}

export function RoadmapView({
  roadmapData,
  backlogData,
  completedCount,
  totalCount,
  currentVersion,
}: RoadmapViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("actual");

  const currentData = activeTab === "actual" ? roadmapData : backlogData;
  const defaultExpanded = activeTab === "actual"
    ? findCurrentVersionGroup(roadmapData.groups, currentVersion)
    : backlogData.groups[0]?.id;

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab("actual")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "actual"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Actual
          <span className="ml-2 text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("backlog")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "backlog"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Backlog
        </button>
      </div>

      <VerticalTimeline
        key={activeTab}
        data={currentData}
        defaultExpanded={defaultExpanded}
        variant="roadmap"
      />
    </div>
  );
}
