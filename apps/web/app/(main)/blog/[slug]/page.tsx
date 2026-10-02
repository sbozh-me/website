import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { evaluate } from "@mdx-js/mdx";
import Image from "next/image";
import { notFound } from "next/navigation";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import {
  ErrorState,
  PostHeader,
  PostLayout,
  PostNavigation,
  ScrollToTop,
  TableOfContents,
} from "@sbozh/blog/components";
import { getAdjacentPosts, type TOCItem } from "@sbozh/blog/utils";
import { PageTheme, ThemeLoaderOverlay, DEFAULT_THEME } from "@sbozh/themes";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";
import { blogMdxComponents } from "@/lib/blog/mdx-components";
import remarkGlitch from "@/lib/blog/remark-glitch";
import remarkHeadingIds from "@/lib/blog/remark-heading-ids";

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

  const adjacent = getAdjacentPosts(await postsPromise, post.slug);

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

  // Compile tldr markdown if present
  let TldrContent: React.ComponentType | null = null;
  if (post.tldr) {
    const { default: Content } = await evaluate(post.tldr, {
      ...runtime,
      remarkPlugins: [remarkGfm],
    } as any);
    TldrContent = () => (
      <Content
        components={{
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
          <PostLayout toc={toc}>
            <div>
              <PostHeader post={post} adjacent={adjacent} />
              {TldrContent && (
                <div className="text-muted-foreground mb-6 [&_p]:inline">
                  <span className="font-medium">TL;DR: </span>
                  <TldrContent />
                </div>
              )}
              {post.image && (
                <figure className="my-8">
                  <Image
                    src={post.image.src}
                    alt={post.image.alt}
                    width={post.image.width || 1920}
                    height={post.image.height || 1080}
                    className="w-full h-auto rounded-lg"
                    priority
                  />
                  {ImageAttributionContent && (
                    <figcaption className="mt-2 text-right text-[11px] leading-snug text-muted-foreground/70 [&_a]:underline [&_a]:decoration-muted-foreground/30 [&_a]:underline-offset-2 [&_a:hover]:text-muted-foreground [&_p]:m-0">
                      <ImageAttributionContent />
                    </figcaption>
                  )}
                </figure>
              )}
              {toc && toc.length > 0 && (
                <div className="lg:hidden mb-8">
                  <TableOfContents items={toc} />
                </div>
              )}
              <div className="prose">
                <MDXContent components={blogMdxComponents} />
              </div>
              {AttributionContent && (
                <div className="mt-12 pt-8 border-t border-border">
                  <h4 className="text-xs font-medium text-muted-foreground mb-3">
                    Attribution
                  </h4>
                  <div className="attribution-content text-xs text-muted-foreground [&_a]:text-muted-foreground [&_a]:underline [&_p]:m-0">
                    <AttributionContent />
                  </div>
                </div>
              )}
              <PostNavigation {...adjacent} />
            </div>
          </PostLayout>
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
