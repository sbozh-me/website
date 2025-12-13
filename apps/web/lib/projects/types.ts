export type ProjectStatus = "active" | "beta" | "coming-soon" | "archived";

export interface ProjectMeta {
  label: string;
  value: string;
}

export interface ProjectTab {
  id: string;
  label: string;
  enabled: boolean;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  status: ProjectStatus;
  heroImage: { src: string; alt: string };
  meta: ProjectMeta[];
  tabs: ProjectTab[];
}
