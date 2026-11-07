import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getDonationsPage, getIntro, getWallet, listWallets } from "../repository";

const ID = "8f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const fetchMock = vi.fn();

function respond(data: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify({ data }), { status }));
}

describe("donations repository", () => {
  beforeEach(() => {
    vi.stubEnv("DIRECTUS_URL", "http://directus.test");
    vi.stubEnv("DIRECTUS_TOKEN", "secret");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("lists published wallets without addresses, using the server token", async () => {
    fetchMock.mockReturnValue(respond([{ asset: "BTC", id: ID, network: "bitcoin" }]));
    expect(await listWallets()).toEqual([{ asset: "BTC", id: ID, network: "bitcoin" }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/items/donation_wallets?fields=id,asset,network&");
    expect(url).not.toContain("address");
    expect(url).toContain("filter[status][_eq]=published");
    expect(init.headers.Authorization).toBe("Bearer secret");
    expect(init.cache).toBe("no-store");
  });

  it("fetches one published wallet with its address", async () => {
    const row = { address: "bc1q", asset: "BTC", id: ID, memo: null, network: "bitcoin", warning: null };
    fetchMock.mockReturnValue(respond([row]));
    expect(await getWallet(ID)).toEqual(row);
    expect(fetchMock.mock.calls[0][0]).toContain(`filter[id][_eq]=${ID}`);
  });

  it("never queries Directus for a non-UUID id", async () => {
    expect(await getWallet("1 OR 1=1")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns nothing when Directus is not configured", async () => {
    vi.stubEnv("DIRECTUS_TOKEN", "");
    expect(await listWallets()).toEqual([]);
    expect(await getIntro()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats 403/404 as empty", async () => {
    fetchMock.mockReturnValue(respond(null, 403));
    expect(await listWallets()).toEqual([]);
    fetchMock.mockReturnValue(respond(null, 404));
    expect(await getWallet(ID)).toBeNull();
  });

  it("trims the intro and maps blank to null", async () => {
    fetchMock.mockReturnValue(respond({ intro: "  Hello  " }));
    expect(await getIntro()).toBe("Hello");
    fetchMock.mockReturnValue(respond({ intro: "   " }));
    expect(await getIntro()).toBeNull();
  });

  it("degrades to an empty page when Directus errors", async () => {
    fetchMock.mockReturnValue(respond(null, 500));
    expect(await getDonationsPage()).toEqual({ intro: null, wallets: [] });
  });
});
