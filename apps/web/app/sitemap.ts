import type { MetadataRoute } from "next";

import { createBlogRepository } from "@/lib/blog/repository";
import { getProjects } from "@/lib/projects/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sbozh.me";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
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
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
    const otherTabs = project.tabs
      .filter((tab) => tab.enabled && tab.id !== "about")
      .map((tab) => ({
        url: `${baseUrl}/projects/${project.slug}/${tab.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    return [aboutRoute, ...otherTabs];
  });

  // Blog posts from Directus
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const repository = createBlogRepository();
    const posts = await repository.getPosts();
    blogRoutes = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("[Sitemap] Failed to fetch blog posts:", error);
  }

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
