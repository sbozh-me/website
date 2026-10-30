import { MonthMarker } from "./MonthMarker";
import { PostCard } from "./PostCard";
import { YearMarker } from "./YearMarker";
import { groupPostsByDate } from "../../utils/date-grouping";
import { getSeriesParts } from "../../utils/series";

import type { PostListItem } from "../../types/post";
import type { Series } from "../../types/series";

export interface TimelineProps {
  posts: PostListItem[];
  /** Labels posts that belong to one of these series */
  series?: Series[];
  className?: string;
}

export function Timeline({ posts, series = [], className }: TimelineProps) {
  const groupedPosts = groupPostsByDate(posts);
  const seriesParts = getSeriesParts(posts, series);

  return (
    <div className={className}>
      {groupedPosts.map((yearGroup) => (
        <section key={yearGroup.year}>
          <YearMarker year={yearGroup.year} />
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <MonthMarker month={monthGroup.month} />
              {monthGroup.posts.map((post) => (
                <PostCard key={post.id} post={post} seriesPart={seriesParts.get(post.id)} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
