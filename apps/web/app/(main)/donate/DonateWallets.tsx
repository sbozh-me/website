"use client";

import { Check, Copy, Eye, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@sbozh/react-ui/components/ui/alert";
import { Badge } from "@sbozh/react-ui/components/ui/badge";
import { Button } from "@sbozh/react-ui/components/ui/button";

import { useAnalytics } from "@/hooks/useAnalytics";
import { networkInfo } from "@/lib/donations/networks";
import type { WalletSummary } from "@/lib/donations/repository";
import type { RevealedWallet, RevealResponse } from "@/lib/donations/reveal";

type RevealState =
  | { readonly status: "hidden" | "loading" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "shown"; readonly wallet: RevealedWallet };

const ERRORS: Record<NonNullable<RevealResponse["reason"]>, string> = {
  invalid: "Could not reveal the address. Reload the page and try again.",
  not_found: "This wallet is no longer available. Reload the page.",
  rate_limited: "Too many requests — try again in a few minutes.",
  unavailable: "The address could not be loaded right now. Try again later.",
};

/**
 * The wallet list from the server carries no addresses. Each one is fetched
 * on click from /api/donations/reveal, with a hidden honeypot field and the
 * time the page rendered so the server can turn away bots.
 */
export function DonateWallets({ wallets }: { readonly wallets: readonly WalletSummary[] }) {
  const startedAt = useRef(Date.now());
  const [website, setWebsite] = useState("");
  const [states, setStates] = useState<Record<string, RevealState>>({});
  const { track } = useAnalytics();

  const setState = (id: string, state: RevealState) =>
    setStates((prev) => ({ ...prev, [id]: state }));

  async function reveal(wallet: WalletSummary) {
    setState(wallet.id, { status: "loading" });
    try {
      const response = await fetch("/api/donations/reveal", {
        body: JSON.stringify({ id: wallet.id, startedAt: startedAt.current, website }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const body = (await response.json().catch(() => ({ ok: false }))) as RevealResponse;
      if (!body.ok || !body.wallet) {
        setState(wallet.id, {
          message: ERRORS[body.reason ?? "unavailable"] ?? ERRORS.unavailable,
          status: "error",
        });
        return;
      }
      setState(wallet.id, { status: "shown", wallet: body.wallet });
      track("donate_reveal", { asset: wallet.asset, network: wallet.network });
    } catch {
      setState(wallet.id, { message: ERRORS.unavailable, status: "error" });
    }
  }

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-border pt-8">
      {/* Humans never see or fill this. */}
      <input
        aria-hidden="true"
        autoComplete="off"
        className="absolute -left-[9999px] h-px w-px opacity-0"
        name="website"
        onChange={(event) => setWebsite(event.target.value)}
        tabIndex={-1}
        type="text"
        value={website}
      />
      {wallets.map((wallet) => (
        <WalletCard
          key={wallet.id}
          onReveal={() => reveal(wallet)}
          state={states[wallet.id] ?? { status: "hidden" }}
          wallet={wallet}
        />
      ))}
    </div>
  );
}

function WalletCard({
  onReveal,
  state,
  wallet,
}: {
  readonly onReveal: () => void;
  readonly state: RevealState;
  readonly wallet: WalletSummary;
}) {
  const label = networkInfo(wallet.network).label;

  return (
    <section
      aria-label={`${wallet.asset} on ${label}`}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{wallet.asset}</h2>
          <Badge variant="outline">{label}</Badge>
        </div>
        {state.status !== "shown" && (
          <Button
            disabled={state.status === "loading"}
            onClick={onReveal}
            size="sm"
            variant="outline"
          >
            <Eye className="size-4" />
            {state.status === "loading" ? "Loading…" : "Show address"}
          </Button>
        )}
      </div>

      {state.status === "error" && (
        <p aria-live="polite" className="mt-4 text-sm text-destructive">
          {state.message}
        </p>
      )}

      {state.status === "shown" && <RevealedAddress wallet={state.wallet} />}
    </section>
  );
}

function RevealedAddress({ wallet }: { readonly wallet: RevealedWallet }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success(`${wallet.asset} address copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — select the address manually.");
    }
  }

  return (
    <div aria-live="polite" className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
      {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI */}
      <img
        alt={`QR code for the ${wallet.asset} address on ${wallet.networkLabel}`}
        className="size-40 shrink-0 self-center rounded-md bg-white sm:self-start"
        height={160}
        src={`data:image/svg+xml;utf8,${encodeURIComponent(wallet.qr)}`}
        width={160}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
            {wallet.address}
          </code>
          <Button
            aria-label={`Copy ${wallet.asset} address`}
            onClick={copy}
            size="icon"
            variant="outline"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
        </div>
        {wallet.memo && (
          <p className="text-sm text-muted-foreground">
            Memo: <code className="font-mono text-foreground">{wallet.memo}</code>
          </p>
        )}
        <Alert>
          <TriangleAlert className="text-secondary" />
          <AlertDescription>{wallet.warning}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
