import type { ProjectRef } from "./project";

/**
 * Full release note (for detail view or full display)
 */
export interface Release {
  id: string;
  version: string;
  title: string;
  summary: string;
  dateReleased: string;
  project: ProjectRef;
}

/**
 * Lightweight release for lists
 * Currently identical to Release, but kept separate for future expansion
 */
export interface ReleaseListItem {
  id: string;
  version: string;
  title: string;
  summary: string;
  dateReleased: string;
  project: ProjectRef;
}
