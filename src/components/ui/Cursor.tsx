'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';

// Egyedi kurzor: kis pont + rugós gyűrű, interaktív elemek fölött címkével.
// Címke: data-cursor="..." attribútum bármelyik elemen.
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 520, damping: 42, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 520, damping: 42, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-cursor');

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
      const target = e.target as Element | null;
      const interactive = target?.closest?.('a, button, input, [data-cursor]');
      setHovering(!!interactive);
      setLabel(interactive?.getAttribute('data-cursor') ?? null);
    };
    const leave = () => setHidden(true);
    const pdown = () => setDown(true);
    const pup = () => setDown(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', pdown);
    window.addEventListener('pointerup', pup);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', pdown);
      window.removeEventListener('pointerup', pup);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = label ? 96 : hovering ? 56 : 30;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      {/* rugós gyűrű / címke-buborék */}
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border"
        style={{ x: rx, y: ry, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: size,
          height: size,
          opacity: hidden ? 0 : 1,
          scale: down ? 0.85 : 1,
          backgroundColor: label ? 'rgba(242,238,228,1)' : 'rgba(242,238,228,0)',
          borderColor: label ? 'rgba(255,208,0,0)' : hovering ? 'rgba(255,208,0,0.9)' : 'rgba(242,238,228,0.45)',
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="px-2 text-center font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.15em] text-ink"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      {/* pont */}
      <motion.div
        className="absolute left-0 top-0 h-[6px] w-[6px] rounded-full bg-signal"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: hidden || label ? 0 : 1 }}
      />
    </div>
  );
}
