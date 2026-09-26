'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import type { MissionStatus } from '@/lib/content';
import { playThump } from '@/lib/sound';

type Props = {
  index: number;
  total: number;
  title: string;
  img: string;
  status: MissionStatus;
  tilt: number;
  onReveal: () => void;
};

// Animáció a pecsét "beütéséhez"
const stampAnimation: Variants = {
  hidden: { opacity: 0, scale: 2.2, rotate: -26 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: -12,
    transition: { type: 'spring', stiffness: 420, damping: 16, mass: 1.1 },
  },
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function MissionCard({ index, total, title, img, status, tilt, onReveal }: Props) {
  // Ez az állapot figyeli, hogy rákattintottak-e már a kártyára
  const [isRevealed, setIsRevealed] = useState(false);
  const isFailed = status === 'Failed';

  const reveal = () => {
    if (isRevealed) return;
    setIsRevealed(true);
    window.setTimeout(() => {
      playThump();
      navigator.vibrate?.(35);
    }, 110);
    onReveal();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 90, rotate: tilt * 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1.1, delay: (index % 3) * 0.12, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ rotate: 0, y: -8, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      className="group w-full max-w-[400px] sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-2.5rem)]"
    >
      <motion.div
        animate={isRevealed ? { x: [0, -7, 6, -3, 0], y: [0, 5, -3, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        onClick={reveal} // Kattintásra felfedjük
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), reveal())}
        role="button"
        tabIndex={0}
        aria-label={`${title} – küldetés kiértékelése`}
        data-cursor={isRevealed ? undefined : 'Pecsét'}
        className={`relative rounded-[20px] border bg-ink-2 p-3 transition-colors duration-500 ${
          isRevealed ? (isFailed ? 'border-fail/40' : 'border-ok/50') : 'border-line group-hover:border-signal/50'
        } ${isRevealed ? '' : 'cursor-pointer'}`}
      >
        {/* akta fejléc */}
        <div className="flex items-center justify-between px-1 pb-3 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45">
          <span>
            Akta <span className="text-paper">{pad(index + 1)}</span>/{pad(total)}
          </span>
          <span className="text-fail/80">Szigorúan titkos</span>
        </div>

        <div className="relative h-64 overflow-hidden rounded-[12px] bg-ink-3 sm:h-72">
          {/* ALAP KÉP */}
          <Image
            src={img}
            alt={title}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className={`object-cover transition-all duration-700 ${
              isRevealed ? 'scale-100 brightness-50 contrast-125 grayscale' : 'group-hover:scale-[1.06]'
            }`}
          />

          {/* A PECSÉT RÉTEG – tisztán CSS, hogy ne függjön külső képtől */}
          <AnimatePresence>
            {isRevealed && (
              <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden p-4">
                {isFailed ? (
                  /* --- FAILED --- */
                  <motion.div
                    variants={stampAnimation}
                    initial="hidden"
                    animate="visible"
                    className="pointer-events-none shrink-0 select-none rounded-[6px] border-[6px] border-fail px-5 py-2 text-center [filter:url(#stamp-ink)]"
                  >
                    <span className="block whitespace-nowrap text-5xl font-black uppercase leading-none tracking-[0.12em] text-fail [font-stretch:120%] md:text-6xl">
                      Failed
                    </span>
                  </motion.div>
                ) : (
                  /* --- SUCCESS --- */
                  <motion.div
                    variants={stampAnimation}
                    initial="hidden"
                    animate="visible"
                    className="pointer-events-none shrink-0 select-none rounded-[6px] border-[6px] border-ok px-4 py-2 text-center [filter:url(#stamp-ink)]"
                  >
                    <span className="block whitespace-nowrap text-sm font-black uppercase leading-none tracking-[0.3em] text-ok md:text-base">
                      Mission
                    </span>
                    <span className="mt-1 block whitespace-nowrap text-2xl font-black uppercase leading-none tracking-[0.02em] text-ok [font-stretch:115%] md:text-3xl">
                      Accomplished
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          {!isRevealed && (
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/80 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-signal" />
              Kiértékelésre vár
            </div>
          )}
        </div>

        {/* CÍM A KÉP ALATT */}
        <h3 className="px-1 pb-2 pt-4 text-xl font-bold leading-tight text-paper sm:text-2xl">{title}</h3>
      </motion.div>
    </motion.div>
  );
}
