'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'CV', href: '/cv' },
  { name: 'Projects', href: '/projects' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex items-center justify-between px-6 md:px-12 lg:px-24 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          sbozh.me
        </Link>
        <nav className="flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors ${
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
