export interface CTAButton {
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'outline'
  icon?: string
}

export interface PersonaStatus {
  text: string
  variant: 'green' | 'yellow' | 'blue' | 'purple'
}

export interface PersonaEntity {
  id: string
  name: string
  title: string
  description: string
  avatar: string
  status?: PersonaStatus
  ctaButtons: CTAButton[]
  blogPersonaSlugs: string[]
}
