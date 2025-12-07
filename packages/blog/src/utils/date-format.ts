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
  const month = SHORT_MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}
