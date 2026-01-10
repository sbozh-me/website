import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { projects } from "@/lib/projects/data";
import { createReleaseRepository, DirectusError } from "@/lib/releases/repository";
import { ReleaseMediaCard, CopyUrlButton } from "@sbozh/release-notes/components";
import { formatReleaseDate, calculateReadingTime, formatReadingTime } from "@sbozh/release-notes/utils";
import type { Release } from "@sbozh/release-notes/types";

export const dynamic = "force-dynamic";

interface ReleaseDetailPageProps {
  params: Promise<{ slug: string; releaseSlug: string }>;
}

const RELEASE_TYPE_CONFIG = {
  feature: { icon: "✦", label: "Feature", color: "text-primary" },
  fix: { icon: "⚡", label: "Fix", color: "text-secondary" },
  breaking: { icon: "⚠", label: "Breaking", color: "text-red-500" },
  maintenance: { icon: "◆", label: "Maintenance", color: "text-muted-foreground" },
} as const;

async function compileSummary(markdown: string): Promise<ReactNode> {
  const { default: Content } = await evaluate(markdown, {
    ...runtime,
  } as any);
  return <Content />;
}

async function getReleaseBySlug(slug: string): Promise<{ release: Release; content: ReactNode } | null> {
  try {
    const repository = createReleaseRepository();
    if (!repository) {
      return null;
    }

    const release = await repository.getReleaseBySlug(slug);
    if (!release) {
      return null;
    }

    const content = await compileSummary(release.summary);
    return { release, content };
  } catch (error) {
    console.error("Failed to fetch release:", error);
    if (error instanceof DirectusError) {
      console.error("Directus error:", error.message, error.status);
    }
    return null;
  }
}

export default async function ReleaseDetailPage({ params }: ReleaseDetailPageProps) {
  const { slug, releaseSlug } = await params;

  const project = projects.find((p) => p.slug === slug);
  if (!project || slug !== "sbozh-me") {
    notFound();
  }

  const result = await getReleaseBySlug(releaseSlug);
  if (!result) {
    notFound();
  }

  const { release, content } = result;
  const formattedDate = formatReleaseDate(release.dateReleased);
  const readingTime = calculateReadingTime(release.summary);
  const typeConfig = release.type ? RELEASE_TYPE_CONFIG[release.type] : null;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href={`/projects/${slug}/releases`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Releases
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{release.title}</h1>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Version badge */}
          {release.version && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 font-mono font-medium">
              {release.version}
            </span>
          )}

          {/* Release type badge */}
          {typeConfig && (
            <div className={`inline-flex items-center gap-1.5 font-medium ${typeConfig.color}`}>
              <span className="text-base leading-none">{typeConfig.icon}</span>
              <span>{typeConfig.label}</span>
            </div>
          )}

          {/* Date */}
          <time dateTime={release.dateReleased} className="text-muted-foreground">
            {formattedDate}
          </time>
        </div>
      </header>

      {/* Meta bar */}
      <div className="flex items-center justify-between border-y border-border py-4 mb-8">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatReadingTime(readingTime)}</span>
          <span>·</span>
          <CopyUrlButton />
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-sm prose-muted max-w-none mb-8">
        {content}
      </article>

      {/* Media */}
      {release.media && (
        <div className="mb-8">
          <ReleaseMediaCard media={release.media} />
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  // For now, return empty array since we'll generate pages on-demand
  // In production with many releases, you might want to pre-generate popular ones
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; releaseSlug: string }> }) {
  const { slug, releaseSlug } = await params;

  const project = projects.find((p) => p.slug === slug);
  if (!project) {
    return {
      title: "Not Found",
    };
  }

  const result = await getReleaseBySlug(releaseSlug);
  if (!result) {
    return {
      title: "Release Not Found",
    };
  }

  const { release } = result;

  return {
    title: `${release.title} - ${project.title}`,
    description: release.summary.slice(0, 160),
  };
}
