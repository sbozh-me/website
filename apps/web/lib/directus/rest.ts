/**
 * Minimal Directus REST call with the server token. Used where the SDK-based
 * repositories don't fit: subscribers, announcements and feed queries that need
 * filters the repositories don't expose.
 */
export async function directusRest<T = { data: unknown }>(path: string, init?: RequestInit): Promise<T> {
  const { DIRECTUS_URL, DIRECTUS_TOKEN } = process.env;
  if (!DIRECTUS_URL || !DIRECTUS_TOKEN) throw new Error("Directus is not configured");

  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`Directus responded with ${response.status}`);
  return response.json();
}
