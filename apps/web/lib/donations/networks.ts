// What the page knows about each chain: a human label, the default warning
// shown under the address, and how to encode the address in a QR code.
//
// Directus stores `network` as a free string (dropdown + allowOther), so an
// unknown network still renders — with its raw name and a generic warning.

export interface NetworkInfo {
  readonly label: string;
  readonly warning: (asset: string) => string;
  /** QR payload. Wallet apps understand `bitcoin:` URIs; Tron/NEAR scan plain addresses. */
  readonly qrPayload: (address: string) => string;
}

const plain = (address: string) => address;

export const NETWORKS: Readonly<Record<string, NetworkInfo>> = {
  bitcoin: {
    label: "Bitcoin",
    qrPayload: (address) => `bitcoin:${address}`,
    warning: () => "Send only BTC over the Bitcoin network. Lightning and wrapped BTC will not arrive.",
  },
  near: {
    label: "NEAR",
    qrPayload: plain,
    warning: (asset) =>
      asset === "NEAR"
        ? "Send only NEAR on NEAR mainnet."
        : `Send only ${asset} on NEAR mainnet (NEP-141). Other networks will not arrive.`,
  },
  tron: {
    label: "Tron (TRC-20)",
    qrPayload: plain,
    warning: (asset) =>
      `Send only ${asset} over Tron (TRC-20). ERC-20, BEP-20 or other networks will be lost.`,
  },
};

export function networkInfo(network: string): NetworkInfo {
  return (
    NETWORKS[network] ?? {
      label: network,
      qrPayload: plain,
      warning: (asset) => `Send only ${asset} on the ${network} network.`,
    }
  );
}
