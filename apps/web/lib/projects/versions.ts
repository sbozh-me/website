import { getProject, getProjects } from "./data";
import type { Project } from "./types";

/** The site itself: its version is this build's package.json, never Directus */
const OWN_PROJECT = "sbozh-me";

/** How long a project version from Directus is served before it is read again */
const REVALIDATE_SECONDS = 60;

interface DirectusProjectVersion {
  slug: string | null;
  version: string | null;
}

/**
 * Project versions set in Directus (`projects.version`), by slug. Lets a sister
 * project's version change without a deploy of this site. Empty when Directus is not
 * configured or down, so every project keeps the version from the code.
 */
export async function getProjectVersions(): Promise<Record<string, string>> {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;
  if (!url || !token) return {};

  try {
    const response = await fetch(`${url}/items/projects?fields=slug,version&limit=-1`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) throw new Error(`Directus answered ${response.status}`);

    const { data } = (await response.json()) as { data: DirectusProjectVersion[] };
    const versions: Record<string, string> = {};
    for (const { slug, version } of data) {
      // Written with or without the v; the pages add their own
      const clean = version?.trim().replace(/^v/i, "");
      if (slug && clean && slug !== OWN_PROJECT) versions[slug] = clean;
    }
    return versions;
  } catch (error) {
    console.error("Failed to fetch project versions:", error);
    return {};
  }
}

function withVersion(project: Project, versions: Record<string, string>): Project {
  const version = versions[project.slug];
  return version ? { ...project, version } : project;
}

/** Every project, with its version from Directus where one is set */
export async function getProjectsWithVersions(): Promise<Project[]> {
  const versions = await getProjectVersions();
  return getProjects().map((project) => withVersion(project, versions));
}

/** One project, with its version from Directus where one is set */
export async function getProjectWithVersion(slug: string): Promise<Project | undefined> {
  const project = getProject(slug);
  if (!project || project.slug === OWN_PROJECT) return project;
  return withVersion(project, await getProjectVersions());
}
