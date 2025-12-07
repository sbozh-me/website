import { MonthMarker } from "./MonthMarker";
import { PostCard } from "./PostCard";
import { YearMarker } from "./YearMarker";
import { groupPostsByDate } from "../../utils/date-grouping";

import type { PostListItem } from "../../types/post";

export interface TimelineProps {
  posts: PostListItem[];
  className?: string;
}

export function Timeline({ posts, className }: TimelineProps) {
  const groupedPosts = groupPostsByDate(posts);

  return (
    <div className={className}>
      {groupedPosts.map((yearGroup) => (
        <section key={yearGroup.year}>
          <YearMarker year={yearGroup.year} />
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <MonthMarker month={monthGroup.month} />
              {monthGroup.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
