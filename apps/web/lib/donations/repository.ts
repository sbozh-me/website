// Reads the /donate data from Directus with the server-side token. Nothing
// here is reachable from the browser: the collections have no public read
// permission, and the page only ever receives the wallet list WITHOUT
// addresses. An address leaves the server one at a time, through
// POST /api/donations/reveal.

/** What the page renders: enough to label a wallet, never its address. */
export interface WalletSummary {
  readonly id: string;
  readonly asset: string;
  readonly network: string;
}

export interface Wallet extends WalletSummary {
  readonly address: string;
  readonly memo: string | null;
  readonly warning: string | null;
}

export interface DonationsPage {
  readonly intro: string | null;
  readonly wallets: readonly WalletSummary[];
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function config() {
  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;
  return url && token ? { token, url } : null;
}

async function get<T>(path: string): Promise<T | null> {
  const cfg = config();
  if (!cfg) return null;
  const response = await fetch(`${cfg.url}${path}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error(`Directus ${path} → ${response.status}`);
  const body = (await response.json()) as { data: T };
  return body.data ?? null;
}

/** Published wallets in Directus sort order, addresses left out. */
export async function listWallets(): Promise<WalletSummary[]> {
  const rows = await get<WalletSummary[]>(
    "/items/donation_wallets?fields=id,asset,network&filter[status][_eq]=published&sort=sort,asset&limit=50",
  );
  return rows ?? [];
}

/** One published wallet with its address, or null. */
export async function getWallet(id: string): Promise<Wallet | null> {
  if (!UUID.test(id)) return null;
  const rows = await get<Wallet[]>(
    `/items/donation_wallets?fields=id,asset,network,address,memo,warning&filter[id][_eq]=${id}&filter[status][_eq]=published&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function getIntro(): Promise<string | null> {
  const page = await get<{ intro: string | null }>("/items/donations_page?fields=intro");
  return page?.intro?.trim() || null;
}

/** Everything the page needs. A Directus outage renders an empty page, not a 500. */
export async function getDonationsPage(): Promise<DonationsPage> {
  try {
    const [intro, wallets] = await Promise.all([getIntro(), listWallets()]);
    return { intro, wallets };
  } catch (error) {
    console.error("[donations] Directus read failed", error);
    return { intro: null, wallets: [] };
  }
}
