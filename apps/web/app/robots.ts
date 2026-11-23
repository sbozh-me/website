import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The CV carries personal contact details; indexed CVs attract scrapers
        disallow: ["/cv"],
      },
    ],
    sitemap: "https://sbozh.me/sitemap.xml",
  };
}
