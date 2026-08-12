import Image from 'next/image';
import { Twitter, Github, Linkedin } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '#fonctionnalites' },
      { label: 'Tarifs', href: '#tarifs' },
      { label: 'Nouveautés', href: '#' },
      { label: 'Démo', href: '#demo' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Communauté', href: '#' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Confidentialité', href: '#' },
      { label: 'Conditions', href: '#' },
      { label: 'Sécurité', href: '#' },
      { label: 'Cookies', href: '#' },
    ],
  },
];

const SOCIALS = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Branding */}
          <div className="md:col-span-1">
            <a
              href="#"
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
            </a>

            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/70">
              Le tableau blanc collaboratif pour les équipes qui pensent et
              créent ensemble.
            </p>

            {/* Réseaux sociaux */}
            <div className="mt-4 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            {/* Signature */}
            <p className="mt-5 font-heading text-xs italic text-foreground/40">
              Arimisa Nathalie
            </p>
          </div>

          {/* Colonnes du footer */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold tracking-wide text-foreground">
                {column.title}
              </h3>

              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-accent"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border/60 pt-6">
          <p className="text-center text-xs text-foreground/50">
            © {new Date().getFullYear()} Solaive. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}