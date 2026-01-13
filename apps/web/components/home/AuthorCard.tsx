"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@sbozh/react-ui/components/ui/button"
import type { Author, CTAButton, AuthorStatus } from "@/types/author"

const easterEggMessages: { title: string; description: string; duration?: number }[] = [
  { title: "Currently it's a secret", description: "This button is under construction. Stay tuned!" },
  { title: "Currently it's a secret", description: "This button is under construction. Stay tuned!" },
  { title: "Ok. Some light:", description: "It's a character in my story" },
  { title: "His job is my bet of future", description: "Because people are able to generate software quickly", duration: 6000 },
  { title: "His story is a meta story", description: "About AI projects boom" },
  { title: "Seriously", description: "There is nothing more" },
  { title: "Except...", description: "It's a first character of my World. Stay tuned - sending you back." },
]

interface AuthorCardProps {
  author: Author
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

function getStatusColor(variant: AuthorStatus['variant']): string {
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

export function AuthorCard({ author }: AuthorCardProps) {
  const clickCountRef = useRef(0)

  const handleEasterEggClick = () => {
    const message = easterEggMessages[clickCountRef.current]
    toast.info(message.title, { description: message.description, duration: message.duration })
    clickCountRef.current = (clickCountRef.current + 1) % easterEggMessages.length
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative mb-8">
        <div className="h-40 w-40 overflow-hidden rounded-full border-2 border-border/50 bg-muted">
          {author.avatar ? (
            <Image
              src={author.avatar}
              alt={author.name}
              width={160}
              height={160}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground">
              {author.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {author.name}
      </h1>

      {/* Title */}
      <p className="mt-4 text-lg text-muted-foreground">
        {author.title}
      </p>

      {/* Status */}
      {author.status && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${getStatusColor(author.status.variant)} animate-pulse`} />
          {author.status.text}
        </div>
      )}

      {/* Description */}
      <p className="mt-6 max-w-md text-muted-foreground whitespace-pre-line">
        {author.description}
      </p>

      {/* CTA Buttons */}
      {author.ctaButtons.length > 0 && (
        <div className="mt-10 pb-1 flex flex-wrap justify-center gap-4">
          {author.ctaButtons.map((cta) => {
            if (cta.action === 'under-construction') {
              return (
                <Button
                  key={cta.label}
                  variant={getButtonVariant(cta.variant)}
                  size="lg"
                  onClick={handleEasterEggClick}
                >
                  {cta.label}
                </Button>
              )
            }
            return (
              <Button
                key={cta.label}
                variant={getButtonVariant(cta.variant)}
                size="lg"
                asChild
              >
                <Link href={cta.href!}>
                  {cta.label}
                </Link>
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
