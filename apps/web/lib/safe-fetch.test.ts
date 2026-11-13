import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { isPublicAddress, parsePublicUrl, safeFetch } from "./safe-fetch";

// A public-looking hostname whose DNS answer is the loopback address (DNS rebinding)
vi.mock("node:dns", async (importOriginal) => {
  const dns = await importOriginal<typeof import("node:dns")>();
  const lookup = (hostname: string, options: unknown, callback: (...args: unknown[]) => void) => {
    if (hostname === "rebind.example") return callback(null, [{ address: "127.0.0.1", family: 4 }]);
    return dns.lookup(hostname, options as never, callback as never);
  };
  return { ...dns, default: { ...dns, lookup }, lookup };
});

describe("isPublicAddress", () => {
  it.each(["160.79.104.10", "8.8.8.8", "1.1.1.1", "2607:6bc0::10", "2a00:1450:4001::200e"])(
    "allows public %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.17.0.2", // Docker bridge
    "192.168.1.10",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fd00::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::7f00:1",
    "not an ip",
  ])("blocks %s", (address) => expect(isPublicAddress(address)).toBe(false));
});

describe("parsePublicUrl", () => {
  it("accepts http(s) URLs on default ports", () => {
    expect(parsePublicUrl("https://example.com/a?b=1")?.href).toBe("https://example.com/a?b=1");
    expect(parsePublicUrl("http://example.com:80/")?.href).toBe("http://example.com/");
    expect(parsePublicUrl("https://8.8.8.8/")?.hostname).toBe("8.8.8.8");
  });

  it.each([
    "ftp://example.com/",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "https://user:pass@example.com/",
    "https://example.com:8443/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://0x7f000001/",
    "http://localhost/",
    "http://api.localhost/",
    "http://metadata.google.internal/",
    "nonsense",
  ])("rejects %s", (raw) => expect(parsePublicUrl(raw)).toBeNull());
});

describe("safeFetch", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((_req, res) => res.end("secret"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const options = { accept: "text/html", userAgent: "test", maxBytes: 1024, timeoutMs: 2000 };

  it("never reaches a local server by IP literal", async () => {
    expect(await safeFetch(`http://127.0.0.1:${port}/`, options)).toBeNull();
  });

  it("refuses hostnames whose DNS answer is a private address", async () => {
    await expect(safeFetch("http://rebind.example/", options)).rejects.toThrow(/Blocked non-public address/);
  });
});
