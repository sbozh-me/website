/**
 * The flying pig: one small, still footer mark. Only Roman White shows it
 * (.flying-pig in @sbozh/themes/roman-white); the dark site hides it.
 */
export function FlyingPig() {
  return (
    <svg
      className="flying-pig"
      viewBox="0 0 64 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="A flying pig"
    >
      {/* body and head */}
      <path d="M14 22c0-7 7-11 17-11s16 3 18 8c3 0 5 2 5 5s-2 5-5 5c-2 5-9 7-18 7S14 30 14 22z" />
      {/* snout */}
      <ellipse cx="54" cy="24" rx="3" ry="3.5" />
      <path d="M53.2 23.2v1.6M54.8 23.2v1.6" />
      {/* ear and eye */}
      <path d="M44 14l3-5 2 7" />
      <circle cx="47.5" cy="20" r="0.6" fill="currentColor" />
      {/* legs */}
      <path d="M21 33v4M27 35v3M38 35v3M44 33v4" />
      {/* curly tail */}
      <path d="M14 21c-3 0-5-2-3.5-4s3.5 0 2 1.5" />
      {/* wing */}
      <path d="M26 15c-3-7 2-12 8-12-1 3 1 4 3 4-1 3 1 4 2 5" />
      <path d="M29 13c1-3 3-5 5-6M32 14c1-2 2-3 4-4" />
    </svg>
  );
}
