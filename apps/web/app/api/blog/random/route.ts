import { NextResponse } from "next/server";
import { createBlogRepository } from "@/lib/blog/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const repository = createBlogRepository();
    // A random read should be readable: planned posts are teasers until they're out
    const posts = (await repository.getPosts()).filter((post) => !post.isPlanned);

    if (posts.length === 0) {
      return NextResponse.json({ error: "No posts found" }, { status: 404 });
    }

    // Get random post and return complete PostListItem
    const randomIndex = Math.floor(Math.random() * posts.length);
    const randomPost = posts[randomIndex];

    return NextResponse.json(randomPost);
  } catch (error) {
    console.error("[Random Blog API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch random post" },
      { status: 500 }
    );
  }
}