import type { Persona } from "./persona";

export type AvatarStatusColor = "green" | "yellow" | "blue" | "purple";

/** A public face of the author. Every persona belongs to one avatar. */
export interface Avatar {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string;
  image?: string;
  /** Status line on the home card, e.g. "Open to work" */
  status?: { text: string; color: AvatarStatusColor };
  /** Absent until the avatar's CV is crafted */
  cvUrl?: string;
  personas: Persona[];
}
