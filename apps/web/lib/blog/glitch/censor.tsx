import "./glitch.css";

/**
 * The site's ✳ logo standing in for a censored letter: `х(;)й` → х✳й.
 * The ✳ character stays in the DOM (transparent) so copying the text keeps it.
 */
export function Censor() {
  return <span className="censor">✳</span>;
}
