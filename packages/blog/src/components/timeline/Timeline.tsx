import { MonthMarker } from "./MonthMarker";
import { PostCard } from "./PostCard";
import { YearMarker } from "./YearMarker";
import { groupPostsByDate } from "../../utils/date-grouping";
import { getSeriesParts } from "../../utils/series";

import type { PostSort } from "../../types/filters";
import type { PostListItem } from "../../types/post";
import type { Series } from "../../types/series";
import type { SeriesPart } from "../../utils/series";

export interface TimelineProps {
  posts: PostListItem[];
  /** Labels posts that belong to one of these series */
  series?: Series[];
  /** Ready-made labels, for when `posts` is filtered and would miscount the parts */
  seriesParts?: Map<string, SeriesPart>;
  sort?: PostSort;
  className?: string;
}

export function Timeline({ posts, series = [], seriesParts, sort, className }: TimelineProps) {
  const groupedPosts = groupPostsByDate(posts, sort);
  const parts = seriesParts ?? getSeriesParts(posts, series);

  return (
    <div className={className}>
      {groupedPosts.map((yearGroup) => (
        <section key={yearGroup.year}>
          <YearMarker year={yearGroup.year} />
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <MonthMarker month={monthGroup.month} />
              {monthGroup.posts.map((post) => (
                <PostCard key={post.id} post={post} seriesPart={parts.get(post.id)} />
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
