import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@sbozh/react-ui/components/ui/button";

import { submitSubscriptionToken } from "@/actions/subscribe";
import { verifyToken } from "@/lib/subscribers/token";
import { describeTopics } from "@/lib/subscribers/topics";

export const metadata: Metadata = {
  title: "Subscription",
  robots: { index: false },
};

interface SubscribePageProps {
  searchParams: Promise<{ token?: string; status?: string }>;
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const { token, status } = await searchParams;
  const payload = token ? verifyToken(token) : null;

  let heading = "This link is no longer valid";
  let text = "It may have expired. You can sign up again from the footer of any page.";
  let action: string | null = null;

  if (status === "confirmed") {
    heading = "You're subscribed";
    text = "News from sbozh.me will now come to your inbox.";
  } else if (status === "unsubscribed") {
    heading = "You're unsubscribed";
    text = "You won't get any more emails from sbozh.me.";
  } else if (payload?.action === "confirm") {
    heading = "Confirm your subscription";
    const what = payload.topics?.length ? describeTopics(payload.topics) : "news";
    text = `Send ${what} from sbozh.me to ${payload.email}?`;
    action = "Confirm";
  } else if (payload?.action === "unsubscribe") {
    heading = "Unsubscribe";
    text = `Stop sending news from sbozh.me to ${payload.email}?`;
    action = "Unsubscribe";
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-xl">
      <h1 className="text-3xl font-bold mb-4">{heading}</h1>
      <p className="text-muted-foreground mb-8">{text}</p>
      {action && (
        <form action={submitSubscriptionToken}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit">{action}</Button>
        </form>
      )}
      {status === "confirmed" && payload?.action === "unsubscribe" && (
        <Link
          href={`/subscribe?token=${token}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Changed your mind? Unsubscribe
        </Link>
      )}
    </div>
  );
}
