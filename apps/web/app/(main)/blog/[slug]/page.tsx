import { evaluate } from "@mdx-js/mdx";
import { notFound } from "next/navigation";
import * as runtime from "react/jsx-runtime";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { PostHeader, PostLayout } from "@sbozh/blog/components";
import { MockBlogRepository } from "@sbozh/blog/data";
import { extractHeadings } from "@sbozh/blog/utils";
import "@sbozh/blog/styles/prose.css";
import "@sbozh/blog/styles/code.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const repository = new MockBlogRepository();
  const post = await repository.getPost(slug);

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
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-6xl mx-auto">
        <PostLayout toc={toc}>
          <div>
            <PostHeader post={post} />
            <div className="prose">
              <MDXContent />
            </div>
          </div>
        </PostLayout>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const repository = new MockBlogRepository();
  const posts = await repository.getPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
