'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog' },
  { name: 'CV', href: '/cv' },
  { name: 'Projects', href: '/projects' },
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex items-center justify-between px-6 md:px-12 lg:px-24 py-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          sbozh.me
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:bg-primary after:transition-[width] after:duration-200 after:ease-out ${
                pathname === item.href
                  ? 'text-primary after:w-full'
                  : 'text-muted-foreground hover:text-primary after:w-0 hover:after:w-full'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-center items-center gap-1.5 p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
              isOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-opacity duration-200 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform duration-200 ${
              isOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile nav menu */}
      <nav
        className={`md:hidden border-t border-border overflow-hidden transition-[max-height] duration-300 ease-out ${
          isOpen ? 'max-h-64' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col px-6 py-4 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`transition-colors ${
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
