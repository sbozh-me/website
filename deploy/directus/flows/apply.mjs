// Upserts the flows from FLOWS_JSON into the Directus this runs next to.
// Runs INSIDE the Directus container (node 22, global fetch), fed over stdin by
// deploy/scripts/flows.sh, so it needs no extra tooling on the host or server.
//
// Env: DIRECTUS_TOKEN (admin), DIRECTUS_URL (default http://localhost:8055),
//      FLOWS_JSON (the flow definitions), DRY_RUN=1 to only print the plan,
//      MODE=backfill to mark already-published items as announced instead.

const url = process.env.DIRECTUS_URL || "http://localhost:8055";
const token = process.env.DIRECTUS_TOKEN;
const dryRun = process.env.DRY_RUN === "1";
if (!token) throw new Error("DIRECTUS_TOKEN is not set");

const mode = process.env.MODE || "flows";

async function api(method, path, body) {
  const response = await fetch(url + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  return response.status === 204 ? {} : (await response.json()).data;
}

async function upsert(collection, item) {
  const existing = await api("GET", `/${collection}/${item.id}?fields=id`);
  const verb = existing ? "update" : "create";
  console.log(`${dryRun ? "[dry run] would " : ""}${verb} ${collection.slice(0, -1)} "${item.name}" (${item.id})`);
  if (dryRun) return;
  if (existing) await api("PATCH", `/${collection}/${item.id}`, item);
  else await api("POST", `/${collection}`, item);
}

if (mode === "backfill") {
  // One-off when announcements go live: everything ALREADY published counts as
  // announced, so the first sweep doesn't email recent posts as if they were new.
  // Drafts are left alone and get announced when they're published.
  const now = new Date().toISOString();
  for (const collection of ["posts", "release_notes"]) {
    const filter = { status: { _eq: "published" }, announced_at: { _null: true } };
    const pending = await api("GET", `/items/${collection}?aggregate[count]=id&filter=${encodeURIComponent(JSON.stringify(filter))}`);
    console.log(`${dryRun ? "[dry run] would mark" : "marking"} ${pending[0].count.id} published ${collection} as announced`);
    if (!dryRun) await api("PATCH", `/items/${collection}`, { query: { filter, limit: -1 }, data: { announced_at: now } });
  }
  console.log(dryRun ? "Dry run only, nothing changed." : "Backfill done.");
  process.exit(0);
}

const flows = JSON.parse(process.env.FLOWS_JSON);

for (const { operations, ...flow } of flows) {
  // The flow must exist before its operations; the first operation is linked after
  await upsert("flows", { ...flow, operation: null });
  for (const operation of operations) {
    await upsert("operations", { ...operation, flow: flow.id, resolve: null, reject: null });
  }
  if (!dryRun) await api("PATCH", `/flows/${flow.id}`, { operation: operations[0]?.id ?? null });
}

console.log(dryRun ? "Dry run only, nothing changed." : "Flows applied.");
