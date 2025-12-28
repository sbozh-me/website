import { describe, expect, it } from "vitest";
import { getProjects } from "@/lib/projects/data";
import sitemapData from "@/lib/seo/sitemap-data.json";

describe("Sitemap Data", () => {
  it("should include all project routes", () => {
    const projects = getProjects();
    const expectedRoutes: string[] = [];

    // Generate expected routes for each project
    projects.forEach((project) => {
      // Main project route (about tab)
      expectedRoutes.push(`/projects/${project.slug}`);

      // Other enabled tabs
      project.tabs
        .filter((tab) => tab.enabled && tab.id !== "about")
        .forEach((tab) => {
          expectedRoutes.push(`/projects/${project.slug}/${tab.id}`);
        });
    });

    // Check that all expected routes exist in sitemap data
    expectedRoutes.forEach((route) => {
      expect(sitemapData).toHaveProperty(route);
      const routeData = sitemapData[route as keyof typeof sitemapData];
      expect(routeData).toHaveProperty("version");
      expect(routeData).toHaveProperty("lastModified");
      expect(routeData.version).toBeTruthy();
      expect(routeData.lastModified).toBeTruthy();
    });

    // Check that we don't have extra routes (optional)
    const sitemapRoutes = Object.keys(sitemapData);
    const projectRoutes = sitemapRoutes.filter((route) =>
      route.startsWith("/projects/")
    );
    expect(projectRoutes.sort()).toEqual(expectedRoutes.sort());
  });

  it("should have valid ISO date formats", () => {
    Object.entries(sitemapData).forEach(([route, data]) => {
      const date = new Date(data.lastModified);
      expect(date).toBeInstanceOf(Date);
      expect(date.toString()).not.toBe("Invalid Date");
    });
  });

  it("should have valid version formats", () => {
    Object.entries(sitemapData).forEach(([route, data]) => {
      // Version should match semantic versioning pattern
      expect(data.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });
});