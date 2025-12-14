"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { TimelineData } from "@/lib/timeline/types";

interface VerticalTimelineProps {
  data: TimelineData;
  defaultExpanded?: string;
  baseGitHubUrl?: string;
}

const GITHUB_REPO = "https://github.com/sbozh-me/website";

export function VerticalTimeline({ data, defaultExpanded, baseGitHubUrl = GITHUB_REPO }: VerticalTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    defaultExpanded ?? data.groups[0]?.id ?? null
  );

  const toggleGroup = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-4 bottom-4 w-px bg-border" />

      <div className="space-y-2">
        {data.groups.map((group) => {
          const isExpanded = expandedId === group.id;

          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-3 w-full text-left group py-2"
              >
                <div
                  className={`relative z-10 size-4 rounded-full border-2 transition-colors ${
                    isExpanded
                      ? "bg-primary border-primary"
                      : "bg-background border-muted-foreground group-hover:border-primary"
                  }`}
                />
                <span
                  className={`font-semibold transition-colors ${
                    isExpanded ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {group.label}
                </span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <span className="text-xs text-muted-foreground ml-auto">
                  {group.items.length} {group.items.length === 1 ? "release" : "releases"}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-8 pb-4">
                  <div className="space-y-6">
                    {group.items.map((item) => (
                      <div key={item.id} className="relative pl-4 border-l-2 border-muted">
                        <div className="flex items-center gap-2 mb-2">
                          <a
                            href={`${baseGitHubUrl}/releases/tag/${item.title}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="View on GitHub"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          {item.subtitle && (
                            <span className="text-sm text-muted-foreground">{item.subtitle}</span>
                          )}
                        </div>
                        <ul className="space-y-1">
                          {item.content.map((line, index) => (
                            <li
                              key={index}
                              className="text-sm text-muted-foreground leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: formatChangeLine(line) }}
                            />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatChangeLine(line: string): string {
  return line.replace(
    /\[([a-f0-9]+)\]\((https:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
  );
}
