import type { MetadataRoute } from "next";

import { createBlogRepository } from "@/lib/blog/repository";
import { createReleaseRepository } from "@/lib/releases/repository";
import { getProjects } from "@/lib/projects/data";
import sitemapData from "@/lib/seo/sitemap-data.json";

// Sitemap fetches dynamic data from Directus, so render dynamically
export const dynamic = "force-dynamic";

// Helper to get lastModified date for a path
function getLastModified(path: string): Date {
  let relativePath = path.replace("https://sbozh.me", "");
  // Handle root path case
  if (relativePath === "") {
    relativePath = "/";
  }
  const data = sitemapData[relativePath as keyof typeof sitemapData];
  if (data?.lastModified) {
    return new Date(data.lastModified);
  }
  return new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sbozh.me";

  // Fetch blog data first to get latest post date for /blog route
  let blogRoutes: MetadataRoute.Sitemap = [];
  let latestBlogPostDate: Date | undefined;
  try {
    const repository = createBlogRepository();
    const posts = await repository.getPosts();

    // Track the latest post date for the /blog route
    if (posts.length > 0) {
      latestBlogPostDate = new Date(posts[0].date);
    }

    blogRoutes = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.lastModified || post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[Sitemap] Failed to fetch blog posts:", error);
  }

  // Fetch release data for release detail pages
  let releaseRoutes: MetadataRoute.Sitemap = [];
  const latestReleaseDates: Record<string, Date> = {};
  try {
    const repository = createReleaseRepository();
    if (repository) {
      const releases = await repository.getReleases({});

      // Track the latest release date per project for /projects/[slug]/releases route
      for (const release of releases) {
        const projectSlug = release.project.slug;
        const releaseDate = new Date(release.dateReleased);
        if (!latestReleaseDates[projectSlug] || releaseDate > latestReleaseDates[projectSlug]) {
          latestReleaseDates[projectSlug] = releaseDate;
        }
      }

      releaseRoutes = releases.map((release) => ({
        url: `${baseUrl}/projects/${release.project.slug}/releases/${release.slug}`,
        lastModified: new Date(release.dateReleased),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    }
  } catch (error) {
    console.error("[Sitemap] Failed to fetch releases:", error);
  }

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: getLastModified(baseUrl),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestBlogPostDate || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: getLastModified(`${baseUrl}/projects`),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Project routes
  const projects = getProjects();
  const projectRoutes: MetadataRoute.Sitemap = projects.flatMap((project) => {
    // "about" tab is at /projects/[slug], others at /projects/[slug]/[tab]
    const aboutRoute = {
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: getLastModified(`${baseUrl}/projects/${project.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
    const otherTabs = project.tabs
      .filter((tab) => tab.enabled && tab.id !== "about")
      .map((tab) => {
        // Use latest release date for releases tab, similar to /blog
        const lastModified = tab.id === "releases" && latestReleaseDates[project.slug]
          ? latestReleaseDates[project.slug]
          : getLastModified(`${baseUrl}/projects/${project.slug}/${tab.id}`);
        return {
          url: `${baseUrl}/projects/${project.slug}/${tab.id}`,
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        };
      });
    return [aboutRoute, ...otherTabs];
  });

  return [...staticRoutes, ...projectRoutes, ...blogRoutes, ...releaseRoutes];
}
