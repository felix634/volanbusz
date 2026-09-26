'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const CHARSET = 'ABCDEFGHIJKLMNOPRSTUVZÁÉÖŐÜŰ0123456789';

type Props = {
  text: string;
  play: boolean;
  delay?: number; // mp
  stagger?: number; // mp / karakter
  cycles?: number; // hány véletlen karakter pörög át leérkezés előtt
  className?: string;
  charClassName?: string;
};

// Indulási tábla (split-flap) effekt: minden betű átpörög néhány
// véletlen karakteren, mielőtt beáll a végleges helyére.
export default function SplitFlap({ text, play, delay = 0, stagger = 0.06, cycles = 9, className, charClassName }: Props) {
  const reduced = useReducedMotion();
  const [chars, setChars] = useState<(string | null)[]>(() => text.split('').map(() => null));

  useEffect(() => {
    if (!play) return;
    if (reduced) {
      setChars(text.split(''));
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      let done = true;
      const next = text.split('').map((c, i) => {
        if (c === ' ') return c;
        const s = delay + i * stagger;
        if (t < s) {
          done = false;
          return null;
        }
        const k = Math.floor((t - s) / 0.055);
        if (k >= cycles) return c;
        done = false;
        return CHARSET[(Math.random() * CHARSET.length) | 0];
      });
      setChars(next);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, reduced, text, delay, stagger, cycles]);

  return (
    <span className={className} role="text" aria-label={text}>
      {text.split('').map((c, i) => (
        <span key={i} aria-hidden className={`relative inline-block ${charClassName ?? ''}`}>
          <span className="invisible">{c === ' ' ? ' ' : c}</span>
          <span key={chars[i] ?? '_'} className="flap-char absolute inset-0 text-center">
            {chars[i] ?? ''}
          </span>
        </span>
      ))}
    </span>
  );
}
