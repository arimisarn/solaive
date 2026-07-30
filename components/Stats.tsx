'use client';

import { Zap, MonitorSmartphone, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const gridContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

export function Stats() {
  return (
    <section className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <motion.dl
          className="grid gap-8 sm:grid-cols-3"
          variants={gridContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
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
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}