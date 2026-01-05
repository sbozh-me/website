import {
  createDirectus,
  rest,
  readItems,
  staticToken,
  type RestClient,
} from "@directus/sdk";
import type { ReleaseRepository } from "./repository";
import type { ReleaseFilters } from "../types/filters";
import type { ProjectRef } from "../types/project";
import type { Release, ReleaseListItem } from "../types/release";

export class DirectusError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "DirectusError";
  }

  static fromError(error: unknown): DirectusError {
    if (error instanceof DirectusError) {
      return error;
    }

    if (
      error &&
      typeof error === "object" &&
      "errors" in error &&
      Array.isArray((error as { errors: unknown[] }).errors)
    ) {
      const directusErrors = (error as { errors: { message: string }[] })
        .errors;
      const message =
        directusErrors[0]?.message || "Unknown Directus error";

      let status: number | undefined;
      if ("response" in error && error.response) {
        const response = error.response as { status?: number };
        status = response.status;
      }

      return new DirectusError(message, status);
    }

    if (error instanceof Error) {
      return new DirectusError(error.message);
    }

    return new DirectusError("An unexpected error occurred");
  }
}

// Directus collection types
interface DirectusRelease {
  id: string;
  version: string;
  title: string;
  summary: string;
  date_released: string;
  project: DirectusProject;
}

interface DirectusProject {
  id: string;
  name: string;
  slug: string;
}

interface DirectusSchema {
  releases: DirectusRelease[];
  projects: DirectusProject[];
}

export interface DirectusConfig {
  url: string;
  token?: string;
  debug?: boolean;
}

export class DirectusRepository implements ReleaseRepository {
  private client: RestClient<DirectusSchema>;
  private debug: boolean;

  constructor(config: DirectusConfig) {
    this.debug = config.debug ?? false;

    const client = createDirectus<DirectusSchema>(config.url).with(
      rest({
        onRequest: (options) => ({
          ...options,
          cache: "no-store",
        }),
      })
    );

    if (config.token) {
      this.client = client.with(staticToken(config.token));
    } else {
      this.client = client;
    }
  }

  private log(method: string, message: string, data?: unknown): void {
    if (this.debug) {
      const prefix = `[ReleaseRepository.${method}]`;
      if (data !== undefined) {
        console.log(prefix, message, JSON.stringify(data, null, 2));
      } else {
        console.log(prefix, message);
      }
    }
  }

  async getReleases(filters?: ReleaseFilters): Promise<ReleaseListItem[]> {
    try {
      const directusFilter = this.buildFilter(filters);
      this.log("getReleases", "Fetching releases with filter:", directusFilter);

      const releases = await this.client.request(
        readItems("releases", {
          filter: directusFilter,
          fields: [
            "id",
            "version",
            "title",
            "summary",
            "date_released",
            { project: ["id", "name", "slug"] },
          ] as unknown as (keyof DirectusRelease)[],
          sort: ["-date_released"],
          limit: filters?.limit ?? -1,
        })
      );

      this.log("getReleases", `Fetched ${releases.length} releases`);
      return (releases as DirectusRelease[]).map(this.mapToReleaseListItem.bind(this));
    } catch (error) {
      this.log("getReleases", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  async getRelease(id: string): Promise<Release | null> {
    try {
      this.log("getRelease", `Fetching release with id "${id}"`);

      const releases = await this.client.request(
        readItems("releases", {
          filter: { id: { _eq: id } },
          fields: [
            "*",
            { project: ["*"] },
          ] as unknown as (keyof DirectusRelease)[],
          limit: 1,
        })
      );

      if (releases.length === 0) {
        this.log("getRelease", `Release not found: "${id}"`);
        return null;
      }

      this.log("getRelease", `Found release: "${releases[0].title}"`);
      return this.mapToRelease(releases[0] as DirectusRelease);
    } catch (error) {
      this.log("getRelease", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  async getProjects(): Promise<ProjectRef[]> {
    this.log("getProjects", "Fetching all projects with releases");
    try {
      // Get unique projects from releases
      const releases = await this.client.request(
        readItems("releases", {
          fields: [{ project: ["id", "name", "slug"] }] as unknown as (keyof DirectusRelease)[],
        })
      );

      // Deduplicate projects
      const projectMap = new Map<string, ProjectRef>();
      for (const release of releases as DirectusRelease[]) {
        if (release.project && !projectMap.has(release.project.id)) {
          projectMap.set(release.project.id, this.mapToProjectRef(release.project));
        }
      }

      const projects = Array.from(projectMap.values());
      this.log("getProjects", `Found ${projects.length} projects`);
      return projects;
    } catch (error) {
      this.log("getProjects", "Error:", error);
      throw DirectusError.fromError(error);
    }
  }

  private buildFilter(filters?: ReleaseFilters): Record<string, unknown> {
    const directusFilter: Record<string, unknown> = {};

    if (filters?.project) {
      directusFilter.project = { slug: { _eq: filters.project } };
    }

    return directusFilter;
  }

  private mapToRelease(release: DirectusRelease): Release {
    return {
      id: release.id,
      version: release.version,
      title: release.title,
      summary: release.summary,
      dateReleased: release.date_released,
      project: this.mapToProjectRef(release.project),
    };
  }

  private mapToReleaseListItem(release: DirectusRelease): ReleaseListItem {
    return {
      id: release.id,
      version: release.version,
      title: release.title,
      summary: release.summary,
      dateReleased: release.date_released,
      project: this.mapToProjectRef(release.project),
    };
  }

  private mapToProjectRef(project: DirectusProject): ProjectRef {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
    };
  }
}
