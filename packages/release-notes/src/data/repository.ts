import type { Release, ReleaseListItem, ReleaseFilters, ProjectRef } from "../types";

/**
 * Abstract repository interface for release notes data access.
 * Implementations can fetch from Directus, mock data, etc.
 */
export interface ReleaseRepository {
  /** Get all releases, optionally filtered */
  getReleases(filters?: ReleaseFilters): Promise<ReleaseListItem[]>;

  /** Get a single release by ID */
  getRelease(id: string): Promise<Release | null>;

  /** Get a single release by slug */
  getReleaseBySlug(slug: string): Promise<Release | null>;

  /** Get all projects that have releases */
  getProjects(): Promise<ProjectRef[]>;
}
