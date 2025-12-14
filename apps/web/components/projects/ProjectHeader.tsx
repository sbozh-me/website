import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import type { Project } from "@/lib/projects/types";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div>
      {/* Hero image */}
      <div className="aspect-[2/1] md:aspect-[4/1] relative overflow-hidden rounded-lg">
        <Image
          src={project.heroImage.src}
          alt={project.heroImage.alt}
          fill
          className="object-cover"
          style={{ objectPosition: project.heroImage.position ?? "center" }}
          priority
        />
        {/* Mobile badge and version on image */}
        <div className="md:hidden absolute top-3 left-3 right-3 flex items-center justify-between">
          <StatusBadge status={project.status} />
          {project.version && (
            <span className="text-sm text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
              v{project.version}
            </span>
          )}
        </div>
        {/* Desktop overlay content */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
        <div className="hidden md:flex absolute bottom-0 left-0 right-0 p-8 justify-between items-end">
          <div>
            <StatusBadge status={project.status} className="mb-3" />
            <h1 className="text-4xl font-bold text-foreground">
              {project.title}
            </h1>
            <p className="mt-2 text-white/80 max-w-2xl [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              {project.tagline}
            </p>
          </div>
          {project.version && (
            <span className="text-white/80 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
              v{project.version}
            </span>
          )}
        </div>
      </div>

      {/* Mobile content below image */}
      <div className="md:hidden mt-4">
        <h1 className="text-2xl font-bold text-foreground">
          {project.title}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {project.tagline}
        </p>
      </div>
    </div>
  );
}
