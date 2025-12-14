import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { getProject, getProjects } from "@/lib/projects/data";
import { getSbozhMeTabContent } from "@/lib/projects/content/sbozh-me";
import { Spark } from "@/components/Spark";
import "@sbozh/blog/styles/prose.css";

const mdxComponents = {
  Spark,
};

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = getProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

function getTabContent(slug: string, tabId: string): string | null {
  if (slug === "sbozh-me") {
    return getSbozhMeTabContent(tabId);
  }
  return null;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  // Render "about" tab content at the root project URL
  const content = getTabContent(slug, "about");

  if (!content) {
    return (
      <div className="prose max-w-none">
        <h2>About</h2>
        <p className="text-muted-foreground">Content coming soon...</p>
      </div>
    );
  }

  const { default: MDXContent } = await evaluate(content, {
    ...runtime,
  } as Parameters<typeof evaluate>[1]);

  return (
    <div className="prose max-w-none">
      <MDXContent components={mdxComponents} />
    </div>
  );
}
