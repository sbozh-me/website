import type { TimelineData, TimelineGroup } from "@sbozh/react-ui/components/ui/vertical-timeline";

interface RoadmapSection {
  title: string;
  isCompleted: boolean;
  items: string[];
}

function parseRoadmapContent(content: string): RoadmapSection[] {
  const sections: RoadmapSection[] = [];
  const sectionRegex = /^## (.+)$/gm;

  let match;
  const matches: { title: string; index: number }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({
      title: match[1],
      index: match.index,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index;
    const endIndex = next ? next.index : content.length;
    const section = content.slice(startIndex, endIndex);

    const items: string[] = [];
    const itemRegex = /^- (.+)$/gm;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(section)) !== null) {
      items.push(itemMatch[1]);
    }

    const isCompleted = current.title.includes("~~") && current.title.includes("✅");
    const cleanTitle = current.title
      .replace(/~~/g, "")
      .replace(/✅/g, "")
      .trim();

    sections.push({
      title: cleanTitle,
      isCompleted,
      items,
    });
  }

  return sections;
}

function parseBacklogContent(content: string): RoadmapSection[] {
  const sections: RoadmapSection[] = [];
  const sectionRegex = /^## (.+)$/gm;

  let match;
  const matches: { title: string; index: number }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({
      title: match[1],
      index: match.index,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index;
    const endIndex = next ? next.index : content.length;
    const section = content.slice(startIndex, endIndex);

    const items: string[] = [];
    const itemRegex = /^- (.+)$/gm;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(section)) !== null) {
      items.push(itemMatch[1]);
    }

    sections.push({
      title: current.title,
      isCompleted: false,
      items,
    });
  }

  return sections;
}

function sectionToTimelineGroup(section: RoadmapSection, index: number): TimelineGroup {
  return {
    id: `section-${index}`,
    label: section.title,
    completed: section.isCompleted,
    items: section.items.length > 0
      ? [{
          id: `items-${index}`,
          title: "",
          content: section.items,
        }]
      : [],
  };
}

export function parseRoadmapFromContent(content: string): { data: TimelineData; completedCount: number; totalCount: number } {
  const sections = parseRoadmapContent(content);
  const completedCount = sections.filter(s => s.isCompleted).length;

  return {
    data: {
      groups: sections.map(sectionToTimelineGroup).reverse(),
    },
    completedCount,
    totalCount: sections.length,
  };
}

export function parseBacklogFromContent(content: string): TimelineData {
  const sections = parseBacklogContent(content);

  return {
    groups: sections.map(sectionToTimelineGroup),
  };
}
