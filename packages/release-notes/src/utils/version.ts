/**
 * Parse version string into comparable parts
 * Handles: "1.0.0", "v1.2.3", "1.3.0-beta"
 */
export function parseVersion(version: string): number[] {
  // Remove 'v' prefix and split on non-numeric separators
  const cleaned = version.replace(/^v/i, "").split(/[.-]/);
  return cleaned.map((part) => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
}

/**
 * Compare two version strings
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a);
  const partsB = parseVersion(b);

  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;

    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }

  return 0;
}

/**
 * Sort releases by version (newest first)
 */
export function sortByVersion<T extends { version: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareVersions(b.version, a.version));
}
