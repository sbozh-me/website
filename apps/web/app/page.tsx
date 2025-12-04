import Link from 'next/link';
import { SocialLinks } from '@/components/SocialLinks';

const navItems = [
  { name: 'Blog', href: '/blog' },
  { name: 'CV', href: '/cv' },
  { name: 'Projects', href: '/projects' },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">sbozh.me</h1>
          <p className="mt-2 text-lg text-muted-foreground">Developer & Creator</p>
        </div>

        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <SocialLinks />
      </div>
    </main>
  );
}
