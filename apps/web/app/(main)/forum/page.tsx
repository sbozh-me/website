import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@sbozh/react-ui/components/ui/badge";
import { Button } from "@sbozh/react-ui/components/ui/button";

import { getAvatars } from "@/lib/avatars";

// Avatars come from Directus at request time (see the note on the home page)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forum",
  description: "Avatars and personas of sbozh.me: who is writing, and in which voice.",
  openGraph: {
    title: "Forum | sbozh.me",
    description: "Avatars and personas of sbozh.me: who is writing, and in which voice.",
    images: ["/ogdefault.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Forum | sbozh.me",
    description: "Avatars and personas of sbozh.me: who is writing, and in which voice.",
    images: ["/ogdefault.png"],
  },
};

export default async function ForumPage() {
  const avatars = await getAvatars();

  return (
    <div className="mx-auto px-6 md:px-12 lg:px-24 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="tracking-tight">Forum</h1>
        <p className="mt-4 text-muted-foreground">
          Two Semens and some Viktor on the home page. No, the author hasn&apos;t lost his
          mind. It&apos;s the same Semen behind every name here. The names just split the
          work.
        </p>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl tracking-tight">Avatars</h2>
            <p className="mt-2 text-muted-foreground">
              An avatar is split by use: a public face with its own name, its own work and
              its own CV.
            </p>
          </div>
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl tracking-tight">Personas</h2>
            <p className="mt-2 text-muted-foreground">
              A persona is a pen name, the voice an avatar writes under on the blog. One
              avatar can have several.
            </p>
          </div>
        </section>

        {avatars.length === 0 ? (
          <p className="mt-12 text-muted-foreground">Avatars are unavailable right now.</p>
        ) : (
          <section className="mt-12 flex flex-col gap-6">
            {avatars.map((avatar) => (

                <article
                  key={avatar.id}
                  className="flex flex-col sm:flex-row gap-6 rounded-lg border border-border p-6"
                >
                  {avatar.image && (
                    <Image
                      src={avatar.image}
                      alt={avatar.name}
                      width={96}
                      height={96}
                      className="rounded-full size-24 shrink-0 object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-lg tracking-tight">{avatar.name}</h3>
                      {avatar.title && (
                        <p className="text-sm text-muted-foreground">{avatar.title}</p>
                      )}
                    </div>
                    {avatar.description && (
                      <p className="whitespace-pre-line">{avatar.description}</p>
                    )}
                    {avatar.personas.length > 0 && (
                      <ul className="flex flex-col gap-1" aria-label={`${avatar.name} personas`}>
                        {avatar.personas.map((persona) => (
                          <li key={persona.id} className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              // Persona colors are hex from Directus; tint the fill at ~10%
                              style={
                                persona.color
                                  ? {
                                      color: persona.color,
                                      borderColor: persona.color,
                                      backgroundColor: `${persona.color}1a`,
                                    }
                                  : undefined
                              }
                            >
                              {persona.name}
                            </Badge>
                            {persona.description && (
                              <span className="text-sm text-muted-foreground">
                                {persona.description}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div>
                      {avatar.cvUrl ? (
                        <Button asChild size="sm">
                          <Link href={avatar.cvUrl}>{avatar.name}&apos;s CV</Link>
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">CV is being crafted.</p>
                      )}
                    </div>
                  </div>
                </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
