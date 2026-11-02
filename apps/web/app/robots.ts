import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // CVs live under each avatar; /cv only redirects there
        disallow: ["/cv", "/forum/*/cv"],
      },
    ],
    sitemap: "https://sbozh.me/sitemap.xml",
  };
}
