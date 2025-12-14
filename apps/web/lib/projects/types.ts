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

export type ProjectLinkType = "github" | "discord" | "website" | "docs";

export interface ProjectLink {
  type: ProjectLinkType;
  label: string;
  href: string;
  variant?: "default" | "primary";
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  status: ProjectStatus;
  heroImage: { src: string; alt: string; position?: "top" | "center" | "bottom" };
  meta: ProjectMeta[];
  tabs: ProjectTab[];
  links?: ProjectLink[];
  version?: string;
}
