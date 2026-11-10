import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { evaluate } from "@mdx-js/mdx";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ErrorState, PostNavigation, ScrollToTop } from "@sbozh/blog/components";
import { getAdjacentPosts, type TOCItem } from "@sbozh/blog/utils";
import { PageTheme, ThemeLoaderOverlay, DEFAULT_THEME } from "@sbozh/themes";
import { LockedContent } from "@/components/LockedContent";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";
import { UNLOCK_COOKIE, isUnlockTokenValid } from "@/lib/content-lock";
import { glitchMdxComponents } from "@/lib/blog/glitch/mdx-components";
import { blogMdxComponents } from "@/lib/blog/mdx-components";
import { PostArticle } from "@/lib/blog/post-article";
import remarkGlitch from "@/lib/blog/remark-glitch";
import remarkHeadingIds from "@/lib/blog/remark-heading-ids";
import { renderTitle } from "@/lib/blog/title-heading";

// Disable caching - always fetch fresh data from Directus
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const repository = createBlogRepository();

  try {
    const post = await repository.getPost(slug);

    if (!post) {
      return {
        title: "Post Not Found",
      };
    }

    // Determine OG image URL
    // Priority: 1. Custom ogImage, 2. Dynamic generation, 3. Hero image, 4. Default
    let ogImage: string;
    if (post.ogImage?.src) {
      ogImage = post.ogImage.src;
    } else if (post.ogGenerate !== false) {
      ogImage = `/api/og/blog/${post.slug}`;
    } else if (post.image?.src) {
      ogImage = post.image.src;
    } else {
      ogImage = "/og/blog-default.png";
    }

    return {
      title: post.title,
      description: post.excerpt,
      authors: [{ name: post.persona.name }],
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        publishedTime: post.date,
        authors: [post.persona.name],
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Blog Post",
    };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  noStore();
  const { slug } = await params;
  const repository = createBlogRepository();

  // Neighbour list is a nice-to-have: a failure only hides post navigation
  const postsPromise = repository.getPosts().catch(() => []);
  const seriesPromise = repository.getSeries().catch(() => []);

  let post;
  let error: DirectusError | null = null;

  try {
    post = await repository.getPost(slug);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  if (error) {
    return (
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
        <div className="max-w-3xl mx-auto">
          <ErrorState
            title="Unable to load post"
            message={error.message}
            status={error.status}
          />
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const adjacent = getAdjacentPosts(await postsPromise, post.slug, await seriesPromise);

  // A locked post shows its header and excerpt only: the body (and its TL;DR and
  // TOC) is never compiled, so none of it reaches the page until the reader unlocks
  if (post.isLocked && !isUnlockTokenValid((await cookies()).get(UNLOCK_COOKIE)?.value)) {
    // Drop the body from the object itself: props of server components can still be
    // serialized into the page payload, so passing `post` whole would leak it
    const teaser = { ...post, content: "", tldr: undefined, attribution: undefined };
    const title = teaser.titleMarkup ? await renderTitle(teaser.titleMarkup) : undefined;
    return (
      <>
        {teaser.theme && <PageTheme theme={teaser.theme} />}
        <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
          <div className="max-w-6xl mx-auto">
            <PostArticle
              post={teaser}
              adjacent={adjacent}
              title={title}
              content={<LockedContent path={`/blog/${post.slug}`} />}
              footer={<PostNavigation {...adjacent} />}
            />
          </div>
        </div>
      </>
    );
  }

  // Compile and run MDX. The TOC comes from the processed headings (h2-h4), so glitch
  // syntax in a heading shows as its base text and the anchors match the heading ids.
  let headings: TOCItem[] = [];
  const { default: MDXContent } = await evaluate(post.content, {
    ...runtime,
    remarkPlugins: [
      remarkGfm,
      remarkGlitch,
      [remarkHeadingIds, { onHeadings: (items: TOCItem[]) => (headings = items) }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          // Both palettes ship; the theme's CSS picks one (roman-white reads the light one)
          theme: { dark: "github-dark", light: "github-light-high-contrast" },
          keepBackground: false,
        },
      ],
    ],
  } as any);
  const toc = post.isTocHidden ? [] : headings;

  // The heading renders the title's glitch syntax; post.title itself is plain text
  const title = post.titleMarkup ? await renderTitle(post.titleMarkup) : undefined;

  // Compile tldr markdown if present (glitch syntax works here too)
  let TldrContent: React.ComponentType | null = null;
  if (post.tldr) {
    const { default: Content } = await evaluate(post.tldr, {
      ...runtime,
      remarkPlugins: [remarkGfm, remarkGlitch],
    } as any);
    TldrContent = () => (
      <Content
        components={{
          ...glitchMdxComponents,
          a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            // Check if it's an external link
            const isExternal = props.href &&
              (props.href.startsWith("http://") ||
                props.href.startsWith("https://"));

            if (isExternal) {
              return (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              );
            }
            return <a {...props} />;
          },
        }}
      />
    );
  }

  // Compile attribution markdown (content credits and hero image credit)
  const AttributionContent = post.attribution
    ? await compileCreditMarkdown(post.attribution)
    : null;
  const ImageAttributionContent = post.image && post.imageAttribution
    ? await compileCreditMarkdown(post.imageAttribution)
    : null;

  return (
    <>
      {post.theme && <PageTheme theme={post.theme} />}
      {post.theme && post.theme !== DEFAULT_THEME && (
        <ThemeLoaderOverlay spinner={<Image src="/android-chrome-192x192.png" alt="" width={48} height={48} />} />
      )}
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-6xl mx-auto">
          <PostArticle
            post={post}
            adjacent={adjacent}
            title={title}
            toc={toc}
            tldr={TldrContent && <TldrContent />}
            content={<MDXContent components={blogMdxComponents} />}
            attribution={AttributionContent && <AttributionContent />}
            imageAttribution={ImageAttributionContent && <ImageAttributionContent />}
            footer={<PostNavigation {...adjacent} />}
          />
        </div>
      </div>
      <ScrollToTop />
    </>
  );
}

// Compile a short credit line of markdown; links open in a new tab
async function compileCreditMarkdown(source: string): Promise<React.ComponentType> {
  const { default: Content } = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm],
  } as any);
  return function CreditContent() {
    return (
      <Content
        components={{
          a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      />
    );
  };
}

export async function generateStaticParams() {
  try {
    const repository = createBlogRepository();
    const posts = await repository.getPosts();

    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch {
    // If Directus is unavailable, skip static generation
    // Pages will be rendered dynamically instead
    return [];
  }
}
