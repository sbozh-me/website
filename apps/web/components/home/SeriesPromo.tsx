import Image from "next/image"
import { PostThumbnail, SeriesStatusBadge } from "@sbozh/blog/components"
import type { SeriesWithPosts } from "@sbozh/blog/utils"
import { cn } from "@sbozh/react-ui/lib/utils"

import { StatusBadge } from "@/components/projects/StatusBadge"
import type { PromotedSeries } from "@/lib/blog/promoted-series"
import type { Project } from "@/lib/projects/types"

interface SeriesPromoProps extends PromotedSeries {
  /** Heading over the series, like the other home sections' */
  title?: string
  /** Project in focus: one wide card under the series, as wide as the two small ones */
  project?: Project
}

/**
 * Promoted series above the avatar hero: the big one laid out like its series page
 * header (Hero with the status badge on it, title, description), left and right under it,
 * then the project in focus across the full width.
 */
export function SeriesPromo({ big, left, right, project, title = "My current focus" }: SeriesPromoProps) {
  const hasSeries = Boolean(big || left || right)
  if (!hasSeries && !project) return null

  return (
    <section aria-labelledby="series-promo-title" className="w-full max-w-3xl pt-14 md:pt-20">
      <h2 id="series-promo-title" className="mb-8 text-center text-2xl font-semibold tracking-tight md:mb-10">
        {title}
      </h2>
      {big && <PromoCard item={big} big />}
      {(left || right) && (
        <div className={cn("grid grid-cols-2 gap-4 sm:gap-6", big && "mt-10 md:mt-12")}>
          {left && <PromoCard item={left} />}
          {right && <PromoCard item={right} />}
        </div>
      )}
      {project && <ProjectPromoCard project={project} className={cn(hasSeries && "mt-10 md:mt-12")} />}
    </section>
  )
}

function PromoCard({ item: { series, posts }, big = false }: { item: SeriesWithPosts; big?: boolean }) {
  const Heading = big ? "h2" : "h3"

  return (
    <a href={`/library/series/${series.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg">
        {series.image ? (
          <Image
            src={series.image.src}
            alt={series.image.alt}
            width={series.image.width || 1920}
            height={series.image.height || 1080}
            sizes={big ? "(min-width: 768px) 768px, 100vw" : "(min-width: 768px) 372px, (min-width: 640px) 50vw, 100vw"}
            priority={big}
            className={cn(
              "w-full transition-transform duration-500 group-hover:scale-[1.02]",
              big ? "h-auto" : "aspect-video object-cover"
            )}
          />
        ) : (
          // Without a Hero, the placeholder tinted by the newest post's persona
          <PostThumbnail post={{ ...posts.at(-1)!, image: undefined }} width={640} className="aspect-video w-full" />
        )}
        {series.status && (
          <SeriesStatusBadge
            status={series.status}
            className={cn(
              "absolute shadow-lg backdrop-blur-md",
              big ? "left-3 top-3" : "left-2 top-2 sm:left-3 sm:top-3",
              big && "md:left-4 md:top-4 md:px-3 md:py-1 md:text-sm"
            )}
          />
        )}
      </div>

      <Heading
        className={cn(
          // Global h2/h3 rules are unlayered, so size and weight need `!` to win
          "tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary",
          big ? "mt-8 text-3xl! font-bold! md:text-4xl!" : "mt-3 text-base! font-semibold! sm:mt-4 sm:text-xl!"
        )}
      >
        {series.title}
      </Heading>
      {series.description && (
        <p
          className={cn(
            "text-muted-foreground",
            big ? "mt-2 whitespace-pre-line" : "mt-1 text-sm line-clamp-2 max-sm:hidden"
          )}
        >
          {series.description}
        </p>
      )}
    </a>
  )
}

/** The project in focus: its wide header image with status and version on it, then title and tagline */
function ProjectPromoCard({ project, className }: { project: Project; className?: string }) {
  const { slug, title, tagline, status, version, heroImage } = project

  return (
    <a href={`/projects/${slug}`} className={cn("group block", className)}>
      {/* As tall as the row of two small cards above it */}
      <div className="relative aspect-video overflow-hidden rounded-lg sm:aspect-[32/9]">
        <Image
          src={heroImage.headerSrc ?? heroImage.src}
          alt={heroImage.alt}
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          style={{ objectPosition: heroImage.position ?? "center" }}
        />
        <StatusBadge status={status} className="absolute left-2 top-2 shadow-lg backdrop-blur-md sm:left-3 sm:top-3" />
        {version && (
          <span className="absolute right-2 top-2 text-sm text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] sm:right-3 sm:top-3">
            v{version}
          </span>
        )}
      </div>

      <h3
        // Global h3 rules are unlayered, so size and weight need `!` to win
        className="mt-3 text-base! font-semibold! tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:mt-4 sm:text-xl!"
      >
        {title}
      </h3>
      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{tagline}</p>
    </a>
  )
}
