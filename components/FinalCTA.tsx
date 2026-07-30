'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09 },
  },
};

export function FinalCTA() {
  return (
    <section
      id="tarifs"
      className="border-t border-border/60 bg-accent text-accent-foreground"
    >
      <motion.div
        className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Prêt à donner vie à vos idées ?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mx-auto mt-4 max-w-xl text-lg text-accent-foreground/80"
        >
          Créez votre premier tableau en quelques secondes. Gratuit, sans carte
          bancaire, sans engagement.
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
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
        </motion.div>
      </motion.div>
    </section>
  );
}