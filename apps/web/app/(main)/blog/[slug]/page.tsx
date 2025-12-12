import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { evaluate } from "@mdx-js/mdx";
import Image from "next/image";
import { notFound } from "next/navigation";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import {
  ErrorState,
  PostHeader,
  PostLayout,
  ScrollToTop,
  TableOfContents,
} from "@sbozh/blog/components";
import { extractHeadings } from "@sbozh/blog/utils";
import { createBlogRepository, DirectusError } from "@/lib/blog/repository";
import "@sbozh/blog/styles/prose.css";
import "@sbozh/blog/styles/code.css";

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

  let post;
  let error: DirectusError | null = null;

  try {
    post = await repository.getPost(slug);
  } catch (e) {
    error = DirectusError.fromError(e);
  }

  if (error) {
    return (
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-24">
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

  // Extract TOC from raw markdown
  const toc = extractHeadings(post.content);

  // Compile and run MDX
  const { default: MDXContent } = await evaluate(post.content, {
    ...runtime,
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: "github-dark",
          keepBackground: false,
        },
      ],
    ],
  } as any);

  // Compile tldr markdown if present
  let TldrContent: React.ComponentType | null = null;
  if (post.tldr) {
    const { default: Content } = await evaluate(post.tldr, {
      ...runtime,
    } as any);
    TldrContent = () => <Content />;
  }

  // Compile attribution markdown if present
  let AttributionContent: React.ComponentType | null = null;
  if (post.attribution) {
    const { default: Content } = await evaluate(post.attribution, {
      ...runtime,
    } as any);
    // Wrap to add target="_blank" to links
    AttributionContent = () => (
      <Content
        components={{
          a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      />
    );
  }

  return (
    <>
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-6xl mx-auto">
          <PostLayout toc={toc}>
            <div>
              <PostHeader post={post} />
              {TldrContent && (
                <div className="text-muted-foreground mb-6 [&_p]:inline">
                  <span className="font-medium">TL;DR: </span>
                  <TldrContent />
                </div>
              )}
              {post.image && (
                <Image
                  src={post.image.src}
                  alt={post.image.alt}
                  width={post.image.width || 1920}
                  height={post.image.height || 1080}
                  className="w-full h-auto rounded-lg my-8"
                  priority
                />
              )}
              {toc && toc.length > 0 && (
                <div className="lg:hidden mb-8">
                  <TableOfContents items={toc} />
                </div>
              )}
              <div className="prose">
                <MDXContent />
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
            </div>
          </PostLayout>
        </div>
      </div>
      <ScrollToTop />
    </>
  );
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
