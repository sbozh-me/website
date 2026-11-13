import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

// Server-side fetching of URLs that readers' content points to (external link previews).
// Only public internet addresses are reachable: the check runs on every DNS answer the
// connection actually uses, so redirects and DNS rebinding can't reach localhost, the
// Docker network or other private services.

const BLOCKED = new net.BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  BLOCKED.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  // No ::ffff:0:0/96 rule: BlockList checks IPv4-mapped addresses against the IPv4 rules
  // above, and that rule would match every IPv4 address
  ["64:ff9b::", 96], // NAT64
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  BLOCKED.addSubnet(network, prefix, "ipv6");
}

/** True for addresses on the public internet; false for private, loopback, reserved etc. */
export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return !BLOCKED.check(address, "ipv4");
  if (family === 6) return !BLOCKED.check(address, "ipv6");
  return false;
}

/** Parses a URL the server may fetch: http(s) on the default ports, no credentials, no private IP literal. */
export function parsePublicUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;

  // IP literals skip DNS, so they are checked here
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && !isPublicAddress(host)) return null;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return null;

  return url;
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

// Resolves like dns.lookup, but fails when any answer is not a public address
function publicLookup(hostname: string, options: { all?: boolean }, callback: LookupCallback) {
  dnsLookup(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, []);
    if (addresses.length === 0 || addresses.some((a) => !isPublicAddress(a.address))) {
      const blocked: NodeJS.ErrnoException = new Error(`Blocked non-public address for ${hostname}`);
      blocked.code = "EBLOCKED";
      return callback(blocked, []);
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0].address, addresses[0].family);
  });
}

export interface SafeResponse {
  status: number;
  /** Final URL after redirects */
  url: string;
  contentType: string;
  body: Buffer;
  /** The body hit maxBytes and was cut off */
  truncated: boolean;
}

interface SafeFetchOptions {
  accept: string;
  userAgent: string;
  maxBytes: number;
  timeoutMs?: number;
  maxRedirects?: number;
}

function requestOnce(url: URL, options: SafeFetchOptions): Promise<SafeResponse | { redirect: URL }> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(
      url,
      {
        headers: { accept: options.accept, "user-agent": options.userAgent },
        lookup: publicLookup as unknown as net.LookupFunction,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location) {
          response.resume();
          try {
            resolve({ redirect: new URL(location, url) });
          } catch (error) {
            reject(error);
          }
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          resolve({
            status,
            url: url.href,
            contentType: String(response.headers["content-type"] ?? ""),
            body: Buffer.concat(chunks).subarray(0, options.maxBytes),
            truncated,
          });
        };

        response.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          size += chunk.length;
          if (size >= options.maxBytes) {
            truncated = size > options.maxBytes;
            response.destroy();
            finish();
          }
        });
        response.on("end", finish);
        response.on("close", finish);
        response.on("error", reject);
      },
    );

    const timer = setTimeout(() => request.destroy(new Error("Timed out")), options.timeoutMs ?? 5000);
    request.on("close", () => clearTimeout(timer));
    request.on("error", reject);
  });
}

/** GET a public URL, following up to maxRedirects redirects, each re-checked. */
export async function safeFetch(raw: string, options: SafeFetchOptions): Promise<SafeResponse | null> {
  let url = parsePublicUrl(raw);
  for (let hop = 0; url && hop <= (options.maxRedirects ?? 3); hop++) {
    const result = await requestOnce(url, options);
    if (!("redirect" in result)) return result;
    url = parsePublicUrl(result.redirect.href);
  }
  return null;
}
