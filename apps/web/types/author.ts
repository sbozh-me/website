import type { AvatarMoves } from "@/lib/blog/glitch/plan"

export interface CTAButton {
  label: string
  href?: string
  action?: 'under-construction'
  variant: 'primary' | 'secondary' | 'outline'
  icon?: string
}

export interface AuthorStatus {
  text: string
  variant: 'green' | 'yellow' | 'blue' | 'purple'
}

export interface Author {
  id: string
  name: string
  title: string
  description: string
  avatar?: string
  status?: AuthorStatus
  ctaButtons: CTAButton[]
  blogAuthorSlugs: string[]
  /** How the avatar glitches while the window is open: through these photos (none: its own), with these random moves */
  glitch?: { photos: string[]; moves: AvatarMoves }
}
