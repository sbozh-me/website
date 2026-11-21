import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createBlogRepository } from "@/lib/blog/repository";

// Secret, slug-only nav: /blog/<slug> looks up the post's type and jumps to
// its canonical URL at /library/<type>/<slug>. Not indexed, not linked.
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogSlugRedirect({ params }: PageProps) {
  noStore();
  const { slug } = await params;
  const repository = createBlogRepository();

  let post;
  try {
    post = await repository.getPost(slug);
  } catch {
    notFound();
  }

  if (!post || !post.type) {
    notFound();
  }

  redirect(`/library/${post.type}/${post.slug}`);
}
