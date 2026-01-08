import {
  DirectusRepository,
  DirectusError,
  type ReleaseRepository,
} from "@sbozh/release-notes/data";

export { DirectusError };

export function createReleaseRepository(): ReleaseRepository | null {
  const directusUrl = process.env.DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_TOKEN;

  if (!directusUrl || !directusToken) {
    return null;
  }

  return new DirectusRepository({
    url: directusUrl,
    token: directusToken,
  });
}
