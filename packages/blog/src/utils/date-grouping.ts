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

export function groupPostsByDate(posts: PostListItem[]): GroupedPosts[] {
  if (posts.length === 0) {
    return [];
  }

  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const grouped = new Map<number, Map<number, PostListItem[]>>();

  for (const post of sortedPosts) {
    const date = new Date(post.date);
    const year = date.getFullYear();
    const month = date.getMonth();

    if (!grouped.has(year)) {
      grouped.set(year, new Map());
    }

    const yearMap = grouped.get(year)!;
    if (!yearMap.has(month)) {
      yearMap.set(month, []);
    }

    yearMap.get(month)!.push(post);
  }

  // Convert to array format, sorted by year (newest first)
  const result: GroupedPosts[] = [];

  const sortedYears = Array.from(grouped.keys()).sort((a, b) => b - a);

  for (const year of sortedYears) {
    const yearMap = grouped.get(year)!;
    const sortedMonths = Array.from(yearMap.keys()).sort((a, b) => b - a);

    const months: MonthGroup[] = sortedMonths.map((monthIndex) => ({
      month: MONTH_NAMES[monthIndex],
      posts: yearMap.get(monthIndex)!,
    }));

    result.push({ year, months });
  }

  return result;
}
