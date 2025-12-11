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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
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

  return (
    <>
      <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-6xl mx-auto">
          <PostLayout toc={toc}>
            <div>
              <PostHeader post={post} />
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
