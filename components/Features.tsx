import {
  PencilLine,
  Users,
  StickyNote,
  Spline,
  Infinity as InfinityIcon,
  MessageSquare,
} from 'lucide-react';

const FEATURES = [
  {
    icon: PencilLine,
    title: 'Dessin libre',
    description:
      'Esquissez et annottez à la main sur un canvas fluide, avec un stylet ou une souris.',
  },
  {
    icon: Users,
    title: 'Curseurs en temps réel',
    description:
      'Voyez qui fait quoi, instantanément. Chaque curseur affiche le prénom de son propriétaire.',
  },
  {
    icon: StickyNote,
    title: 'Post-its illimités',
    description:
      'Capturez une idée en un clic, déplacez-la, colorez-la, et regroupez-la avec d’autres.',
  },
  {
    icon: Spline,
    title: 'Formes et connecteurs',
    description:
      'Reliez vos idées avec des flèches et des formes qui restent alignées quand vous bougez.',
  },
  {
    icon: InfinityIcon,
    title: 'Canvas infini',
    description:
      'Jamais trop petit. Zoomez et déplacez-vous librement sur un espace sans limites.',
  },
  {
    icon: MessageSquare,
    title: 'Commentaires',
    description:
      'Laissez des remarques précises à côté d’un élément et résolvez-les ensemble.',
  },
];

export function Features() {
  return (
    <section
      id="fonctionnalites"
      className="border-t border-border/60 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tout ce qu’il faut pour penser ensemble
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            Des outils simples pour des idées claires. Conçu pour la vitesse et
            la fluidité, sans courbe d’apprentissage.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
