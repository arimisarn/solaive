import { Zap, MonitorSmartphone, WifiOff } from 'lucide-react';

const STATS = [
  {
    icon: Zap,
    value: '150 ms',
    label: 'Synchronisation en moins de 150 ms',
  },
  {
    icon: MonitorSmartphone,
    value: '0',
    label: 'Aucune installation requise',
  },
  {
    icon: WifiOff,
    value: '100 %',
    label: 'Fonctionne même hors ligne',
  },
];

export function Stats() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <dl className="grid gap-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <stat.icon className="h-5 w-5" />
              </div>
              <dt className="mt-4 font-heading text-3xl font-bold text-accent sm:text-4xl">
                {stat.value}
              </dt>
              <dd className="mt-2 max-w-xs text-sm leading-relaxed text-foreground/70">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
