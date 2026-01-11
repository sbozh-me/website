"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@sbozh/react-ui/components/ui/button"
import type { PersonaEntity, CTAButton } from "@/types/persona-entity"

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

      {/* Description */}
      <p className="mt-6 max-w-md text-muted-foreground">
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
