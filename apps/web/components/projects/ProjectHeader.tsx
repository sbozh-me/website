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
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <StatusBadge status={project.status} className="mb-3" />
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">
          {project.title}
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">{project.tagline}</p>
      </div>
    </div>
  );
}
