import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectLayout } from "@/components/projects/ProjectLayout";
import { Breadcrumbs } from "@/components/projects/Breadcrumbs";
import { getProject } from "@/lib/projects/data";
import { createReleaseRepository } from "@/lib/releases/repository";

interface ReleaseDetailLayoutProps {
  params: Promise<{ slug: string; releaseSlug: string }>;
  children: React.ReactNode;
}

async function getReleaseTitle(releaseSlug: string): Promise<string | null> {
  try {
    const repository = createReleaseRepository();
    if (!repository) return null;

    const release = await repository.getReleaseBySlug(releaseSlug);
    return release?.title ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ReleaseDetailLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {};
  }

  return {
    title: project.title,
    description: project.tagline,
    openGraph: {
      type: "website",
      title: `${project.title} | sbozh.me`,
      description: project.tagline,
      images: [`/api/og/projects/${slug}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | sbozh.me`,
      description: project.tagline,
      images: [`/api/og/projects/${slug}`],
    },
  };
}

export default async function ReleaseDetailLayout({
  params,
  children,
}: ReleaseDetailLayoutProps) {
  const { slug, releaseSlug } = await params;

  const project = getProject(slug);
  if (!project) {
    notFound();
  }

  const releaseTitle = await getReleaseTitle(releaseSlug);

  const breadcrumbSegments = [
    { label: "Projects", href: "/projects" },
    { label: project.title, href: `/projects/${slug}` },
    { label: "Releases", href: `/projects/${slug}/releases` },
    ...(releaseTitle ? [{ label: releaseTitle }] : []),
  ];

  return (
    <ProjectLayout
      project={project}
      breadcrumbs={<Breadcrumbs segments={breadcrumbSegments} />}
    >
      {children}
    </ProjectLayout>
  );
}
