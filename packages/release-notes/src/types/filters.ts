/**
 * Filters for release notes queries
 */
export interface ReleaseFilters {
  /** Filter by project slug */
  project?: string;
  /** Limit number of results */
  limit?: number;
  /** Number of results to skip (for pagination) */
  offset?: number;
}
