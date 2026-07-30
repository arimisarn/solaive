import { FilePlus2, UserPlus, Radio } from 'lucide-react';

const STEPS = [
  {
    icon: FilePlus2,
    number: '01',
    title: 'Créez un tableau',
    description:
      'Ouvrez un nouveau tableau blanc en un clic. Aucune installation, aucun téléchargement.',
  },
  {
    icon: UserPlus,
    number: '02',
    title: 'Invitez votre équipe',
    description:
      'Partagez un lien et tout le monde rejoint instantanément, sans créer de compte au préalable.',
  },
  {
    icon: Radio,
    number: '03',
    title: 'Collaborez en direct',
    description:
      'Dessinez, écrivez et organisez vos idées ensemble. Chaque action est visible immédiatement.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border/60 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Comment ça marche
          </h2>
          <p className="mt-4 text-lg text-foreground/70">
            Trois étapes, moins d’une minute, et vous êtes prêt à créer.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center"
            >
              {/* connecteur horizontal */}
              {index < STEPS.length - 1 && (
                <div
                  className="absolute left-1/2 top-9 hidden h-px w-full bg-border md:block"
                  aria-hidden="true"
                />
              )}

              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background p-5 text-accent">
                <step.icon className="h-7 w-7" />
              </div>

              <span className="mt-4 font-heading text-sm font-bold tracking-widest text-accent/70">
                {step.number}
              </span>
              <h3 className="mt-1 font-heading text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
