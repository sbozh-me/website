import { Github, MessageCircle, Globe, BookOpen, SquarePlus } from "lucide-react";
import { Button } from "@sbozh/react-ui/components/ui/button";
import type { Project, ProjectLinkType } from "@/lib/projects/types";

const linkIcons: Record<ProjectLinkType, React.ComponentType<{ className?: string }>> = {
  github: Github,
  discord: SquarePlus,
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
