/**
 * A post is planned while its publish time is still ahead. It's worked out on every
 * read rather than stored, so the post goes live on its own at that time.
 */
export function isPlannedDate(date: string | null | undefined, now: number = Date.now()): boolean {
  if (!date) return false;
  const time = Date.parse(date);
  return !Number.isNaN(time) && time > now;
}
