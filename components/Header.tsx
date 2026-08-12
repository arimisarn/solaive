'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'Connexion', href: '/connexion' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <Image
            src="/logo.png"
            alt="Solaive"
            width={50}
            height={50}
            className="h-[50px] w-[50px] rounded-[5px] object-contain"
            priority
          />

          <span className="font-heading text-2xl font-bold tracking-tight text-accent">
            Solaive
          </span>
        </Link>

        {/* Navigation desktop */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA desktop */}
        <div className="hidden md:block">
          <Link
            href="/inscription"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-sm"
          >
            Essayer gratuitement
          </Link>
        </div>

        {/* Menu mobile */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <ul className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li className="pt-2">
              <Link
                href="/inscription"
                className="block rounded-xl bg-accent px-3 py-2.5 text-center text-base font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                onClick={() => setOpen(false)}
              >
                Essayer gratuitement
              </Link>
            </li>
          </ul>
        </div>
      )}
    </motion.header>
  );
}