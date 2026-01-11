export interface CTAButton {
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
  icon?: string
}

export interface PersonaEntity {
  id: string
  name: string
  title: string
  description: string
  avatar: string
  ctaButtons: CTAButton[]
  blogPersonaSlugs: string[]
}
