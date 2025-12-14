import Link from "next/link";
import { Github, MessageCircle, Globe, BookOpen } from "lucide-react";
import type { Project, ProjectLinkType } from "@/lib/projects/types";

const linkIcons: Record<ProjectLinkType, React.ComponentType<{ className?: string }>> = {
  github: Github,
  discord: MessageCircle,
  website: Globe,
  docs: BookOpen,
};

interface ProjectLinksProps {
  project: Project;
}

export function ProjectLinks({ project }: ProjectLinksProps) {
  if (!project.links?.length) {
    return null;
  }

  return (
    <aside className="hidden lg:block w-[200px] shrink-0 sticky top-24 self-start">
      <nav className="space-y-1">
        {project.links.map((link) => {
          const Icon = linkIcons[link.type];
          return (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
