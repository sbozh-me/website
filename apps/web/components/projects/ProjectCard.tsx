import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { Project } from "@/lib/projects/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { slug, title, tagline, status, heroImage, meta } = project;

  return (
    <Link
      href={`/projects/${slug}`}
      className="block bg-muted border border-border rounded-lg overflow-hidden transition-colors hover:border-primary"
    >
      <div className="aspect-video relative">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          className="object-cover"
        />
        <StatusBadge status={status} className="absolute top-4 right-4" />
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4">{tagline}</p>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {meta.map((item) => (
            <span key={item.label}>
              <span className="font-medium text-foreground">{item.label}:</span>{" "}
              {item.value}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
