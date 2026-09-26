'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion';

// Görgetésre a kép egy kis "ablakból" teljes képernyőre nyílik,
// közben fekete-fehérből színesbe vált.
export default function GroupPhoto() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const inset = useTransform(scrollYProgress, [0, 0.6], [16, 0]);
  const insetX = useTransform(scrollYProgress, [0, 0.6], [24, 0]);
  const radius = useTransform(scrollYProgress, [0, 0.6], [28, 0]);
  const clip = useMotionTemplate`inset(${inset}% ${insetX}% ${inset}% ${insetX}% round ${radius}px)`;
  const scale = useTransform(scrollYProgress, [0, 0.6], [1.12, 1]);
  const gray = useTransform(scrollYProgress, [0.15, 0.65], [1, 0]);
  const filter = useMotionTemplate`grayscale(${gray})`;
  const leftX = useTransform(scrollYProgress, [0, 0.6], ['0%', '-60%']);
  const rightX = useTransform(scrollYProgress, [0, 0.6], ['0%', '60%']);
  const wordsOpacity = useTransform(scrollYProgress, [0.35, 0.6], [1, 0]);
  const captionOpacity = useTransform(scrollYProgress, [0.6, 0.75], [0, 1]);

  return (
    <section id="csapatkep" ref={ref} className="relative h-[260vh] bg-ink">
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        {/* két oldalra szétcsúszó feliratok */}
        <motion.div
          aria-hidden
          style={{ opacity: wordsOpacity }}
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-between px-4 text-[clamp(2.5rem,11vw,12rem)] font-black uppercase leading-none tracking-tight [font-stretch:125%] sm:px-8"
        >
          <motion.span style={{ x: leftX }} className="text-outline text-paper/40">
            Volán
          </motion.span>
          <motion.span style={{ x: rightX }} className="text-outline text-paper/40">
            Busz
          </motion.span>
        </motion.div>

        <motion.div
          style={{ clipPath: clip }}
          className="relative z-10 aspect-[2048/946] max-h-full w-full"
        >
          <motion.div style={{ scale, filter }} className="absolute inset-0">
            <Image
              src="/group.jpg"
              alt="A Volánbusz Nyrt. Csapata"
              fill
              sizes="100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

          <motion.div
            style={{ opacity: captionOpacity }}
            className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/80 sm:p-8 sm:text-xs"
          >
            <span>
              <span className="text-signal">(Fig. 01)</span> A Volánbusz Nyrt. Csapata
            </span>
            <span className="hidden sm:inline">6 / 6 fő fedélzeten</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
