"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@sbozh/react-ui/components/ui/button"
import type { PersonaEntity, CTAButton, PersonaStatus } from "@/types/persona-entity"

interface PersonaCardProps {
  persona: PersonaEntity
}

function getButtonVariant(variant: CTAButton['variant']): 'default' | 'secondary' | 'outline' {
  switch (variant) {
    case 'primary':
      return 'default'
    case 'secondary':
      return 'secondary'
    case 'outline':
      return 'outline'
    default:
      return 'default'
  }
}

function getStatusColor(variant: PersonaStatus['variant']): string {
  switch (variant) {
    case 'green':
      return 'bg-green-500'
    case 'yellow':
      return 'bg-yellow-500'
    case 'blue':
      return 'bg-blue-500'
    case 'purple':
      return 'bg-purple-500'
    default:
      return 'bg-muted-foreground'
  }
}

export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative mb-8">
        <div className="h-40 w-40 overflow-hidden rounded-full border-2 border-border/50 bg-muted">
          {persona.avatar ? (
            <Image
              src={persona.avatar}
              alt={persona.name}
              width={160}
              height={160}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
              {persona.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {persona.name}
      </h1>

      {/* Title */}
      <p className="mt-4 text-lg text-muted-foreground">
        {persona.title}
      </p>

      {/* Status */}
      {persona.status && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${getStatusColor(persona.status.variant)} animate-pulse`} />
          {persona.status.text}
        </div>
      )}

      {/* Description */}
      <p className="mt-6 max-w-md text-muted-foreground whitespace-pre-line">
        {persona.description}
      </p>

      {/* CTA Buttons */}
      {persona.ctaButtons.length > 0 && (
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {persona.ctaButtons.map((cta) => (
            <Button
              key={cta.label}
              variant={getButtonVariant(cta.variant)}
              size="lg"
              asChild
            >
              <Link href={cta.href}>
                {cta.label}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
