'use client';

import { Github, MessageCircle, Globe, BookOpen, SquarePlus } from "lucide-react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import type { Project, ProjectLinkType } from "@/lib/projects/types";
import { useExternalLinkTracking } from "@/hooks/useExternalLinkTracking";

const linkIcons: Record<ProjectLinkType, React.ComponentType<{ className?: string }>> = {
  github: Github,
  discord: SquarePlus,
  website: Globe,
  docs: BookOpen,
};

interface ProjectLinksProps {
  project: Project;
  mobile?: boolean;
}

export function ProjectLinks({ project, mobile = false }: ProjectLinksProps) {
  const { trackRepositoryClick, trackDiscordInviteClick, trackExternalLink } = useExternalLinkTracking();

  if (!project.links?.length) {
    return null;
  }

  const handleLinkClick = (link: typeof project.links[0]) => {
    // Track repository clicks
    if (link.type === 'github') {
      trackRepositoryClick({
        repository: link.href,
        projectName: project.title,
        platform: 'github',
        location: 'project_sidebar',
      });
    }
    // Track Discord invite clicks
    else if (link.type === 'discord') {
      // Extract invite code from URL if possible
      const inviteCode = link.href.match(/discord\.gg\/([a-zA-Z0-9]+)/)?.[1];
      trackDiscordInviteClick({
        inviteCode,
        serverName: project.title,
        location: 'project_sidebar',
      });
    }
    // Track other external links
    else {
      trackExternalLink({
        url: link.href,
        label: link.label,
        projectId: project.slug,
        location: 'project_sidebar',
      });
    }
  };

  if (mobile) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-4 lg:hidden">
        <span className="text-sm text-muted-foreground">Links:</span>
        {project.links.map((link) => {
          const Icon = linkIcons[link.type];
          const variant = link.variant === "primary" ? "default" : "ghost";

          return (
            <Button
              key={link.href}
              variant={variant}
              size="sm"
              asChild
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link)}
              >
                <Icon className="size-4" />
                {link.label}
              </a>
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <aside className="hidden lg:block w-[200px] shrink-0 sticky top-24 self-start">
      <nav className="space-y-1">
        {project.links.map((link) => {
          const Icon = linkIcons[link.type];
          const variant = link.variant === "primary" ? "default" : "ghost";

          return (
            <Button
              key={link.href}
              variant={variant}
              className="w-full"
              asChild
            >
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleLinkClick(link)}
              >
                <Icon className="size-4" />
                {link.label}
              </a>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
