import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <section
      id="tarifs"
      className="border-t border-border/60 bg-accent text-accent-foreground"
    >
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Prêt à donner vie à vos idées ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-accent-foreground/80">
          Créez votre premier tableau en quelques secondes. Gratuit, sans carte
          bancaire, sans engagement.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-background px-6 text-base font-medium text-accent transition-all hover:bg-background/90 hover:shadow-sm sm:w-auto"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/connexion"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-accent-foreground/30 px-6 text-base font-medium text-accent-foreground transition-colors hover:bg-accent-foreground/10 sm:w-auto"
          >
            Contacter l’équipe
          </Link>
        </div>
      </div>
    </section>
  );
}
