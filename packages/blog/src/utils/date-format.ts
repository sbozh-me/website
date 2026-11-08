const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  // Publish timestamps are UTC: read them in UTC so server and browser agree
  const month = SHORT_MONTH_NAMES[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${month} ${day}`;
}
