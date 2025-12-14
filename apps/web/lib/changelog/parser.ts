import type { TimelineData, TimelineGroup, TimelineItem } from "@sbozh/react-ui/components/ui/vertical-timeline";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

function parseChangelogContent(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const versionRegex = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/gm;

  let match;
  const matches: { version: string; date: string; index: number }[] = [];

  while ((match = versionRegex.exec(content)) !== null) {
    matches.push({
      version: match[1],
      date: match[2],
      index: match.index,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const startIndex = current.index;
    const endIndex = next ? next.index : content.length;
    const section = content.slice(startIndex, endIndex);

    const changes: string[] = [];
    const changeRegex = /^- (.+)$/gm;
    let changeMatch;

    while ((changeMatch = changeRegex.exec(section)) !== null) {
      changes.push(changeMatch[1]);
    }

    entries.push({
      version: current.version,
      date: current.date,
      changes,
    });
  }

  return entries;
}

function getMinorVersion(version: string): string {
  const parts = version.split(".");
  return `${parts[0]}.${parts[1]}`;
}

function groupByMinorVersion(entries: ChangelogEntry[]): Map<string, ChangelogEntry[]> {
  const groups = new Map<string, ChangelogEntry[]>();

  for (const entry of entries) {
    const minor = getMinorVersion(entry.version);
    const existing = groups.get(minor) ?? [];
    existing.push(entry);
    groups.set(minor, existing);
  }

  return groups;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function entryToTimelineItem(entry: ChangelogEntry): TimelineItem {
  return {
    id: entry.version,
    title: `v${entry.version}`,
    subtitle: formatDate(entry.date),
    content: entry.changes,
  };
}

export function parseChangelogFromContent(content: string): TimelineData {
  const entries = parseChangelogContent(content);
  const grouped = groupByMinorVersion(entries);

  const groups: TimelineGroup[] = [];

  for (const [minor, versionEntries] of grouped) {
    groups.push({
      id: minor,
      label: `v${minor}.x`,
      items: versionEntries.map(entryToTimelineItem),
    });
  }

  return { groups };
}
