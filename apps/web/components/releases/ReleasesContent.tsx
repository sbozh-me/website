"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@sbozh/react-ui/components/ui/tabs";
import { ReleaseNotesTab } from "./ReleaseNotesTab";
import { ChangelogTab } from "./ChangelogTab";
import { RoadmapTab } from "./RoadmapTab";
import type { ReleaseListItem } from "@sbozh/release-notes/types";
import type { TimelineData } from "@sbozh/react-ui/components/ui/vertical-timeline";

type ReleasesResult =
  | { success: true; releases: ReleaseListItem[]; summaries: Record<string, ReactNode>; hasMore: boolean; currentVersion: string }
  | { success: false; error: string; status?: number };

type RoadmapData = {
  roadmapData: TimelineData;
  backlogData: TimelineData;
  completedCount: number;
  totalCount: number;
  currentVersion: string;
} | null;

interface ReleasesContentProps {
  projectSlug: string;
  activeTab: string;
  releaseNotesData: ReleasesResult;
  changelogData: TimelineData | null;
  roadmapData: RoadmapData;
}

const VALID_TABS = ["notes", "changelog", "roadmap"] as const;
type ValidTab = typeof VALID_TABS[number];

export function ReleasesContent({
  projectSlug,
  activeTab,
  releaseNotesData,
  changelogData,
  roadmapData,
}: ReleasesContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate and normalize tab
  const currentTab: ValidTab = VALID_TABS.includes(activeTab as ValidTab)
    ? (activeTab as ValidTab)
    : "notes";

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "notes") {
      // Default tab, remove query param
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.push(`/projects/${projectSlug}/releases${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  return (
    <div className="w-full">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="mb-8 flex justify-center">
          <TabsList>
            <TabsTrigger value="notes">Release Notes</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notes" className="mt-0">
          <ReleaseNotesTab data={releaseNotesData} projectSlug={projectSlug} />
        </TabsContent>

        <TabsContent value="changelog" className="mt-0">
          <ChangelogTab data={changelogData} />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-0">
          <RoadmapTab data={roadmapData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
