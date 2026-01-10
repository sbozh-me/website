import type { ProjectRef } from "./project";

/**
 * Media attachment for a release (image or video)
 */
export interface ReleaseMedia {
  type: "image" | "video";
  url: string;
  alt?: string;
}

/**
 * Release type for visual categorization
 */
export type ReleaseType = "feature" | "fix" | "breaking" | "maintenance";

/**
 * Full release note (for detail view or full display)
 */
export interface Release {
  id: string;
  slug: string;
  version: string;
  title: string;
  summary: string;
  dateReleased: string;
  project: ProjectRef;
  media?: ReleaseMedia;
  type?: ReleaseType;
}

/**
 * Lightweight release for lists
 * Currently identical to Release, but kept separate for future expansion
 */
export interface ReleaseListItem {
  id: string;
  slug: string;
  version: string;
  title: string;
  summary: string;
  dateReleased: string;
  project: ProjectRef;
  media?: ReleaseMedia;
  type?: ReleaseType;
}
