#!/usr/bin/env node
// Push donation wallets from the git-ignored .private/donations/wallets.json
// into Directus (donation_wallets + the donations_page singleton).
//
//   node deploy/scripts/donations-sync.mjs [local|prod] [--yes] [--file path]
//
// Without --yes it only prints what it would do. Upserts by asset + network;
// rows in Directus that the file does not mention are left untouched.
// Addresses are validated per network so a typo fails here, not in a donor's
// wallet.
//
// local: DIRECTUS_URL / DIRECTUS_TOKEN from apps/web/.env.local
// prod:  PUBLIC_URL / DIRECTUS_TOKEN read from the server's .env over ssh
//        (kept in memory, never printed or written to disk).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--")) ?? "local";
const yes = args.includes("--yes");
const fileArg = args.indexOf("--file");
const file = fileArg >= 0 ? resolve(args[fileArg + 1]) : resolve(ROOT, ".private/donations/wallets.json");

const SSH_HOST = process.env.SSH_HOST ?? "sbozhme";
const APP_DIR = process.env.APP_DIR ?? "/opt/sbozh-me";

const die = (msg) => {
  console.error(`error: ${msg}`);
  process.exit(1);
};

function parseEnv(text) {
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

function connection() {
  if (target === "local") {
    const env = parseEnv(readFileSync(resolve(ROOT, "apps/web/.env.local"), "utf8"));
    if (!env.DIRECTUS_URL || !env.DIRECTUS_TOKEN) die("apps/web/.env.local lacks DIRECTUS_URL/DIRECTUS_TOKEN");
    return { token: env.DIRECTUS_TOKEN, url: env.DIRECTUS_URL };
  }
  if (target === "prod") {
    const text = execFileSync("ssh", ["-n", SSH_HOST, `grep -E '^(PUBLIC_URL|DIRECTUS_TOKEN)=' ${APP_DIR}/.env`], {
      encoding: "utf8",
    });
    const env = parseEnv(text);
    if (!env.PUBLIC_URL || !env.DIRECTUS_TOKEN) die(`${APP_DIR}/.env on ${SSH_HOST} lacks PUBLIC_URL/DIRECTUS_TOKEN`);
    return { token: env.DIRECTUS_TOKEN, url: env.PUBLIC_URL.replace(/\/$/, "") };
  }
  return die(`unknown target '${target}' (use local or prod)`);
}

const VALID = {
  bitcoin: /^(bc1[02-9ac-hj-np-z]{11,87}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/,
  near: /^([0-9a-f]{64}|(?=.{2,64}$)([a-z0-9]+[-_])*[a-z0-9]+(\.([a-z0-9]+[-_])*[a-z0-9]+)*\.(near|tg))$/,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
};

function load() {
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    die(`cannot read ${file}: ${error.message}`);
  }
  const wallets = Array.isArray(data.wallets) ? data.wallets : die("wallets.json: 'wallets' must be an array");
  const seen = new Set();
  for (const [i, w] of wallets.entries()) {
    const where = `wallets[${i}] (${w.asset} on ${w.network})`;
    for (const key of ["asset", "network", "address"]) {
      if (typeof w[key] !== "string" || !w[key].trim()) die(`${where}: '${key}' is required`);
    }
    w.address = w.address.trim();
    const re = VALID[w.network];
    if (re && !re.test(w.address)) die(`${where}: '${w.address}' is not a valid ${w.network} address`);
    const key = `${w.asset}|${w.network}`;
    if (seen.has(key)) die(`${where}: duplicate asset + network`);
    seen.add(key);
  }
  return { intro: typeof data.intro === "string" ? data.intro : undefined, wallets };
}

async function main() {
  const { intro, wallets } = load();
  const { token, url } = connection();

  async function api(method, path, body) {
    const res = await fetch(`${url}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      method,
    });
    const text = await res.text();
    if (!res.ok) die(`${method} ${path} → ${res.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text).data : null;
  }

  const existing = await api("GET", "/items/donation_wallets?fields=id,asset,network,address,memo,warning,status,sort&limit=-1");
  console.log(`${target}: ${url} — ${existing.length} wallet(s) in Directus${yes ? "" : " (dry run, pass --yes to write)"}`);

  for (const [index, w] of wallets.entries()) {
    const row = {
      address: w.address,
      asset: w.asset,
      memo: w.memo?.trim() || null,
      network: w.network,
      sort: index + 1,
      status: w.status ?? "published",
      warning: w.warning?.trim() || null,
    };
    const match = existing.find((e) => e.asset === w.asset && e.network === w.network);
    const label = `${w.asset} on ${w.network}`;
    if (!match) {
      console.log(`  + create ${label}`);
      if (yes) await api("POST", "/items/donation_wallets", row);
      continue;
    }
    const changed = Object.keys(row).filter((k) => (match[k] ?? null) !== row[k]);
    if (changed.length === 0) {
      console.log(`  = ${label} unchanged`);
      continue;
    }
    console.log(`  ~ update ${label}: ${changed.join(", ")}`);
    if (yes) await api("PATCH", `/items/donation_wallets/${match.id}`, Object.fromEntries(changed.map((k) => [k, row[k]])));
  }

  for (const e of existing) {
    if (!wallets.some((w) => w.asset === e.asset && w.network === e.network)) {
      console.log(`  ! ${e.asset} on ${e.network} is in Directus but not in the file — left as is (${e.status})`);
    }
  }

  if (intro !== undefined) {
    const page = await api("GET", "/items/donations_page?fields=intro");
    if ((page?.intro ?? null) === intro) {
      console.log("  = intro unchanged");
    } else {
      console.log("  ~ update intro");
      if (yes) await api("PATCH", "/items/donations_page", { intro });
    }
  }

  console.log(yes ? "done." : "dry run only.");
}

await main();
