import type { PostSort } from "../types/filters";
import type { PostListItem } from "../types/post";

export interface MonthGroup {
  month: string;
  posts: PostListItem[];
}

export interface GroupedPosts {
  year: number;
  months: MonthGroup[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Turns YYYY-MM into a label like "October 2026". */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `${MONTH_NAMES[Number(monthNumber) - 1]} ${year}`;
}

export function groupPostsByDate(
  posts: PostListItem[],
  sort: PostSort = "newest",
): GroupedPosts[] {
  if (posts.length === 0) {
    return [];
  }

  const direction = sort === "newest" ? -1 : 1;
  const sortedPosts = [...posts].sort(
    (a, b) =>
      direction * (new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  const grouped = new Map<number, Map<number, PostListItem[]>>();

  for (const post of sortedPosts) {
    const date = new Date(post.date);
    // Publish timestamps are UTC: read them in UTC so server and browser agree
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();

    if (!grouped.has(year)) {
      grouped.set(year, new Map());
    }

    const yearMap = grouped.get(year)!;
    if (!yearMap.has(month)) {
      yearMap.set(month, []);
    }

    yearMap.get(month)!.push(post);
  }

  // Convert to array format, years and months in the same direction as the posts
  const result: GroupedPosts[] = [];

  const sortedYears = Array.from(grouped.keys()).sort(
    (a, b) => direction * (a - b),
  );

  for (const year of sortedYears) {
    const yearMap = grouped.get(year)!;
    const sortedMonths = Array.from(yearMap.keys()).sort(
      (a, b) => direction * (a - b),
    );

    const months: MonthGroup[] = sortedMonths.map((monthIndex) => ({
      month: MONTH_NAMES[monthIndex],
      posts: yearMap.get(monthIndex)!,
    }));

    result.push({ year, months });
  }

  return result;
}
