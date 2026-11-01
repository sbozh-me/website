import { PostTile } from "./PostTile";

import type { PostListItem } from "../../types/post";
import type { SeriesPart } from "../../utils/series";

export interface PostGridProps {
  posts: PostListItem[];
  seriesParts?: Map<string, SeriesPart>;
}

export function PostGrid({ posts, seriesParts }: PostGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostTile key={post.id} post={post} seriesPart={seriesParts?.get(post.id)} />
      ))}
    </div>
  );
}
