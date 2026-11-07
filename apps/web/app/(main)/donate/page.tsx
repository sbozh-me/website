import type { Metadata } from "next";

import { getDonationsPage } from "@/lib/donations/repository";

import { DonateWallets } from "./DonateWallets";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support sbozh.me with BTC, USDT or NEAR",
};

// Wallets are edited in Directus; read them on every request so a change is
// live without a redeploy. The page itself never contains an address.
export const dynamic = "force-dynamic";

const DEFAULT_INTRO =
  "If something here saved you time or made you think, you can support the work with crypto. Pick a network, reveal the address, and double-check the network before you send.";

export default async function DonatePage() {
  const { intro, wallets } = await getDonationsPage();
  const paragraphs = (intro ?? DEFAULT_INTRO).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Donate</h1>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mt-6 whitespace-pre-line text-muted-foreground">
            {paragraph}
          </p>
        ))}
        {wallets.length > 0 ? (
          <DonateWallets wallets={wallets} />
        ) : (
          <p className="mt-10 border-t border-border pt-8 text-muted-foreground">
            Donation addresses are not available right now. Please check back later.
          </p>
        )}
      </div>
    </div>
  );
}
