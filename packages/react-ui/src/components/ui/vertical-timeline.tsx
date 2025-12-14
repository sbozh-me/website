"use client";

import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@sbozh/react-ui/lib/utils";

export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string[];
}

export interface TimelineGroup {
  id: string;
  label: string;
  items: TimelineItem[];
  completed?: boolean;
}

export interface TimelineData {
  groups: TimelineGroup[];
}

interface VerticalTimelineProps {
  data: TimelineData;
  defaultExpanded?: string;
  baseGitHubUrl?: string;
  formatLine?: (line: string) => string;
  className?: string;
  renderNode?: (props: { isExpanded: boolean; isCompleted?: boolean }) => React.ReactNode;
  renderCount?: (count: number) => React.ReactNode;
  variant?: "changelog" | "roadmap";
}

function changelogFormatLine(line: string): string {
  return line
    .replace(/~~([^~]+)~~/g, '<span class="line-through text-muted-foreground/60">$1</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(
      /\[([a-f0-9]+)\]\((https:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline">$1</a>'
    );
}

function roadmapFormatLine(line: string): string {
  return line
    .replace(/~~([^~]+)~~/g, '<span class="inline-flex items-center gap-1"><svg class="size-3 text-green-500 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg><span class="text-muted-foreground">$1</span></span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function DefaultNode({ isExpanded, isCompleted }: { isExpanded: boolean; isCompleted?: boolean }) {
  if (isCompleted) {
    return (
      <div className="relative z-10 size-4 flex items-center justify-center">
        <svg className="size-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-10 size-4 rounded-full border-2 transition-colors",
        isExpanded
          ? "bg-primary border-primary"
          : "bg-background border-muted-foreground group-hover:border-primary"
      )}
    />
  );
}

function VerticalTimeline({
  data,
  defaultExpanded,
  baseGitHubUrl,
  formatLine,
  className,
  renderNode,
  renderCount,
  variant = "changelog",
}: VerticalTimelineProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    defaultExpanded ?? data.groups[0]?.id ?? null
  );

  const toggleGroup = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const defaultFormatLine = variant === "roadmap" ? roadmapFormatLine : changelogFormatLine;
  const lineFormatter = formatLine ?? defaultFormatLine;

  const NodeComponent = renderNode ?? DefaultNode;

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-[8px] top-4 bottom-4 w-px bg-border" />

      <div className="space-y-2">
        {data.groups.map((group) => {
          const isExpanded = expandedId === group.id;
          const hasContent = group.items.length > 0 && group.items.some(item => item.content.length > 0);

          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-3 w-full text-left group py-2"
              >
                <NodeComponent isExpanded={isExpanded} isCompleted={group.completed} />
                <span
                  className={cn(
                    "font-semibold transition-colors",
                    group.completed
                      ? "text-muted-foreground"
                      : isExpanded
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {group.label}
                </span>
                {hasContent && (
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
                {renderCount ? (
                  renderCount(group.items.length)
                ) : variant === "changelog" ? (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {group.items.length} {group.items.length === 1 ? "release" : "releases"}
                  </span>
                ) : null}
              </button>

              {isExpanded && hasContent && (
                <div className="ml-8 pb-4">
                  {variant === "changelog" ? (
                    <div className="space-y-6">
                      {group.items.map((item) => (
                        <div key={item.id} className="relative pl-4 border-l-2 border-muted">
                          <div className="flex items-center gap-2 mb-2">
                            {baseGitHubUrl && item.title && (
                              <a
                                href={`${baseGitHubUrl}/releases/tag/${item.title}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title="View on GitHub"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            )}
                            {item.title && (
                              <h4 className="font-medium text-foreground">{item.title}</h4>
                            )}
                            {item.subtitle && (
                              <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                            )}
                          </div>
                          <ul className="space-y-1">
                            {item.content.map((line, index) => (
                              <li
                                key={index}
                                className="text-sm text-muted-foreground leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: lineFormatter(line) }}
                              />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {group.items.flatMap((item) =>
                        item.content.map((line, index) => (
                          <li
                            key={`${item.id}-${index}`}
                            className="text-sm text-muted-foreground leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: lineFormatter(line) }}
                          />
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { VerticalTimeline };
export type { VerticalTimelineProps };
