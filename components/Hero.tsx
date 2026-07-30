'use client';

import { ArrowRight, Play, MousePointer2, PenTool } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const textContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

function NamedCursor({
  name,
  color,
  className,
  animation,
  style,
}: {
  name: string;
  color: string;
  className?: string;
  animation?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`absolute ${className ?? ''}`}
      style={{ animation, ...style }}
      aria-hidden="true"
    >
      <MousePointer2
        className="h-5 w-5 drop-shadow-sm"
        style={{ fill: color, color }}
      />
      <span
        className="ml-1 mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Texte */}
          <motion.div
            className="text-center lg:text-left"
            variants={textContainer}
            initial="hidden"
            animate="show"
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70"
            >
              <span className="h-2 w-2 rounded-full bg-accent" />
              Collaboration en temps réel
            </motion.span>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Créez ensemble,
              <br />
              <span className="text-accent">en temps réel</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 lg:mx-0"
            >
              Un tableau blanc infini où votre équipe dessine, écrit et
              organisse ses idées ensemble, en direct, depuis n’importe où.
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
            >
              <Link
                href="/inscription"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 text-base font-medium text-accent-foreground transition-all hover:bg-accent/90 hover:shadow-sm sm:w-auto"
              >
                Commencer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 text-base font-medium text-foreground transition-all hover:border-accent/40 hover:text-accent sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Voir la démo
              </a>
            </motion.div>
          </motion.div>

          {/* Mockup du tableau collaboratif */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {/* barre d'outils */}
              <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-foreground/20" />
                  <span className="h-3 w-3 rounded-full bg-foreground/20" />
                  <span className="h-3 w-3 rounded-full bg-foreground/20" />
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/60">
                  <PenTool className="h-3.5 w-3.5" />
                  Tableau de lancement
                </div>
                <div className="flex -space-x-2">
                  <span className="h-6 w-6 rounded-full border-2 border-card bg-accent" />
                  <span className="h-6 w-6 rounded-full border-2 border-card bg-amber-400" />
                  <span className="h-6 w-6 rounded-full border-2 border-card bg-emerald-400" />
                </div>
              </div>

              {/* canvas */}
              <div className="relative h-80 bg-[radial-gradient(circle,#cfd8dc_1px,transparent_1px)] [background-size:18px_18px] sm:h-96">
                {/* post-its */}
                <div className="absolute left-6 top-6 h-20 w-24 rotate-[-4deg] rounded-md bg-amber-300 p-2 text-[10px] font-medium text-amber-900 shadow-sm">
                  Idées produit
                </div>
                <div className="absolute left-36 top-12 h-20 w-24 rotate-[3deg] rounded-md bg-emerald-300 p-2 text-[10px] font-medium text-emerald-900 shadow-sm">
                  Roadmap Q3
                </div>
                <div className="absolute left-20 top-36 h-20 w-24 rotate-[-2deg] rounded-md bg-sky-300 p-2 text-[10px] font-medium text-sky-900 shadow-sm">
                  Retours clients
                </div>

                {/* formes + connecteur */}
                <svg
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <line
                    x1="62%"
                    y1="24%"
                    x2="78%"
                    y2="44%"
                    stroke="#191970"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                  />
                  <rect
                    x="70%"
                    y="16%"
                    width="60"
                    height="44"
                    rx="8"
                    fill="none"
                    stroke="#191970"
                    strokeWidth="2"
                  />
                  <circle
                    cx="82%"
                    cy="52%"
                    r="20"
                    fill="none"
                    stroke="#191970"
                    strokeWidth="2"
                  />
                </svg>

                {/* curseurs nommés animés */}
                <NamedCursor
                  name="Léa"
                  color="#191970"
                  className="left-[20%] top-[60%]"
                  animation="cursor-a 9s ease-in-out infinite"
                />
                <NamedCursor
                  name="Karim"
                  color="#f59e0b"
                  className="left-[60%] top-[70%]"
                  animation="cursor-b 11s ease-in-out infinite"
                />
              </div>
            </div>

            {/* carte flottante décorative */}
            <motion.div
              className="absolute -right-3 -top-3 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-sm sm:block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
            >
              +3 personnes connectées
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}