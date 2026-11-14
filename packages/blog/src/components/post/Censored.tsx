import { Fragment } from "react";

// The raw `(;)` censor (excerpts) and the ✳ a flattened title already carries
const CENSOR = /\(;\)|✳/;

/**
 * Plain post text (a card's title, an excerpt) with its censors shown as the site's ✳
 * logo, the way the post body and TL;DR render them. The `.censor` style lives in the
 * app's glitch.css; the ✳ stays in the DOM so copying the text keeps it.
 */
export function Censored({ text }: { readonly text: string }) {
  if (!CENSOR.test(text)) return <>{text}</>;
  return (
    <>
      {text.split(CENSOR).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="censor">✳</span>}
          {part}
        </Fragment>
      ))}
    </>
  );
}
