/**
 * Calculate reading time for text content
 * @param text - Text content (markdown, plain text, etc.)
 * @param wordsPerMinute - Average reading speed (default: 200 wpm)
 * @returns Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(text: string, wordsPerMinute = 200): number {
  // Remove markdown syntax for more accurate word count
  const cleanText = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`]+`/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove headers
    .replace(/#{1,6}\s/g, "")
    // Remove emphasis markers
    .replace(/[*_]{1,2}/g, "")
    // Remove HTML tags
    .replace(/<[^>]+>/g, "");

  // Count words (split by whitespace)
  const words = cleanText.trim().split(/\s+/).length;

  // Calculate reading time (minimum 1 minute)
  const minutes = Math.ceil(words / wordsPerMinute);

  return Math.max(1, minutes);
}

/**
 * Format reading time as human-readable string
 * @param minutes - Reading time in minutes
 * @returns Formatted string (e.g., "5 min read")
 */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
