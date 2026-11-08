import type { Metadata } from "next";

import { SdsCheatSheet } from "./SdsCheatSheet";
import { SubmitForm } from "./SubmitForm";

export const metadata: Metadata = {
  title: "Submit a text",
  description:
    "Send a text to the sbozh.me blog. No account, no email, fully anonymous.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div>
          <p className="text-sm">
            <a
              href="/blog"
              className="text-muted-foreground hover:text-foreground"
            >
              ← Blog
            </a>
          </p>
          <h1 className="mt-4 text-3xl md:text-4xl tracking-tight">
            Submit a text
          </h1>
          <p className="mt-4 text-muted-foreground">
            Got something to say? Write it here and send it. No registration, no
            email, no name required.
          </p>

          <section
            aria-labelledby="how-it-works"
            className="mt-10 space-y-4 text-muted-foreground"
          >
            <h2 id="how-it-works" className="text-lg text-foreground">
              How it works
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Anonymous.</strong> Nothing
                that identifies you is stored with your text. Your IP address is
                only held in memory for an hour to stop spam, and never saved
                next to your words.
              </li>
              <li>
                <strong className="text-foreground">
                  Read by a human first.
                </strong>{" "}
                Nothing goes live automatically. Your text can be{" "}
                <strong className="text-foreground">cancelled</strong> (never
                published) or{" "}
                <strong className="text-foreground">redacted</strong>{" "}
                (shortened, corrected, names and personal details removed)
                before it appears on the blog.
              </li>
              <li>
                <strong className="text-foreground">No take-backs.</strong>{" "}
                Since we don&apos;t know who you are, you can&apos;t withdraw or
                edit it after sending, and we can&apos;t tell you whether it was
                published. Watch the blog.
              </li>
              <li>
                <strong className="text-foreground">Hero image.</strong>{" "}
                Always the Senate&apos;s call. You send words; the picture on
                top is chosen when the text is published. Images inside your
                text stay yours.
              </li>
              <li>
                <strong className="text-foreground">Credit.</strong> If
                published, it&apos;s signed with your pen name, or
                &ldquo;Anonymous&rdquo; if you leave it empty.
              </li>
              <li>
                <strong className="text-foreground">Not a crisis line.</strong>{" "}
                If you&apos;re in danger right now, contact local emergency
                services or someone you trust. This form is read days later, not
                minutes.
              </li>
            </ul>
          </section>

          <SdsCheatSheet />
        </div>

        <SubmitForm />
      </div>
    </div>
  );
}
