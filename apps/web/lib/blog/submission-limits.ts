// Shared by the /blog/submit form (client) and the API route (server).

export const MAX_TITLE = 200;
export const MAX_PEN_NAME = 80;
export const MAX_CONTENT = 20_000;
/** Shorter than this isn't a post, it's a test. */
export const MIN_CONTENT = 20;
