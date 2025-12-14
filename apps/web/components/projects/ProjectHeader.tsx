import Image from "next/image";
import { StatusBadge } from "./StatusBadge";
import type { Project } from "@/lib/projects/types";

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div className="relative">
      <div className="aspect-[3/1] md:aspect-[4/1] relative overflow-hidden rounded-lg">
        <Image
          src={project.heroImage.src}
          alt={project.heroImage.alt}
          fill
          className="object-cover"
          style={{ objectPosition: project.heroImage.position ?? "center" }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end">
        <div>
          <StatusBadge status={project.status} className="mb-3" />
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
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
  );
}
