'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { Flip, Tap } from '@/components/ui/Icons';

type Props = {
  index: number;
  total: number;
  name: string;
  imgNormal: string;
  imgFunny: string;
  description: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

export default function MemberCard({ index, total, name, imgNormal, imgFunny, description }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // egér alatti 3D billenés
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(tiltY, { stiffness: 180, damping: 18 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.5), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tiltY.set((px - 0.5) * 14);
    tiltX.set((0.5 - py) * 12);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };
  const onLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  };

  return (
    <div
      className="perspective-1000 group h-[min(560px,72svh)] w-[min(86vw,380px)] shrink-0 touch-manipulation lg:h-[min(580px,68vh)] lg:w-[min(400px,28vw)]"
      onClick={handleFlip}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor={isFlipped ? 'Vissza' : 'Fordítsd'}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${name} – kártya megfordítása`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleFlip())}
    >
      <motion.div className="preserve-3d relative h-full w-full" style={{ rotateX, rotateY }}>
        <motion.div
          className="preserve-3d relative h-full w-full"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          onAnimationComplete={() => setIsAnimating(false)}
        >
          {/* FRONT SIDE (Sima) */}
          <div className="backface-hidden absolute inset-0 flex flex-col overflow-hidden rounded-[22px] border border-line bg-ink-2 p-3 transition-colors duration-500 group-hover:border-signal/60">
            <div className="flex items-center justify-between px-1 pb-3 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45">
              <span>Munkatárs</span>
              <span>
                <span className="text-signal">{pad(index + 1)}</span> / {pad(total)}
              </span>
            </div>
            <div className="relative flex-1 overflow-hidden rounded-[14px] bg-ink-3">
              <Image
                src={imgNormal}
                alt={name}
                fill
                sizes="(min-width: 1024px) 28vw, 86vw"
                className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
              />
              {/* fényvisszaverődés */}
              <motion.div
                className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: glare }}
              />
              {/* Vizuális segítség mobilon: egy kis kéz ikon jobb felül */}
              <div className="absolute right-3 top-3 rounded-full bg-ink/60 p-2 backdrop-blur md:hidden">
                <Tap className="h-5 w-5 text-paper" />
              </div>
            </div>
            <div className="flex items-end justify-between gap-3 px-1 pb-1 pt-4">
              <div>
                <h3 className="text-[clamp(2.2rem,3.4vw,3.2rem)] font-black uppercase leading-[0.85] tracking-tight text-paper [font-stretch:125%]">
                  {name}
                </h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper/45 md:text-[11px]">
                  Kattints / Bökj a titokért!
                </p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-signal transition-all duration-500 group-hover:rotate-180 group-hover:border-signal group-hover:bg-signal group-hover:text-ink">
                <Flip className="h-5 w-5" />
              </span>
            </div>
          </div>

          {/* BACK SIDE (Vicces) */}
          <div
            className="backface-hidden absolute inset-0 overflow-hidden rounded-[22px] border-2 border-fail bg-fail/10"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <Image src={imgFunny} alt={`${name} vicces`} fill sizes="(min-width: 1024px) 28vw, 86vw" className="object-cover" />
            <div className="absolute left-4 top-4 -rotate-3 rounded-sm border-2 border-fail bg-ink/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-fail backdrop-blur">
              Leleplezve
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/85 to-transparent p-5 pt-16">
              <h3 className="text-4xl font-black uppercase leading-none tracking-tight text-paper [font-stretch:125%]">{name}</h3>
              <p className="mt-2 text-lg font-bold italic leading-snug text-signal md:text-xl">„{description}”</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
