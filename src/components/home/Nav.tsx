'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import Clock from '@/components/ui/Clock';
import { BusFront } from '@/components/ui/Icons';
import { sections } from '@/lib/content';
import { useGateUnlocked } from '@/lib/gate';

// Felső sáv + "útvonal" csík: a szakaszok a járat megállói,
// a kis busz a görgetéssel halad végig a vonalon.
export default function Nav() {
  const unlocked = useGateUnlocked();
  const { scrollYProgress, scrollY } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  const busLeft = useTransform(progress, (p) => `${p * 100}%`);
  const [stopsAt, setStopsAt] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      setStopsAt(
        sections.map(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return 0;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.min(1, Math.max(0, top / max));
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    let idx = 0;
    stopsAt.forEach((s, i) => {
      if (p >= s - 0.004) idx = i;
    });
    setActive(idx);
  });
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));

  return (
    <motion.header
      initial={{ y: -90 }}
      animate={{ y: unlocked ? 0 : -90 }}
      transition={{ duration: 1, delay: unlocked ? 1.3 : 0, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? 'bg-ink/75 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-8">
        <a href="#telephely" className="group flex items-center gap-3" data-cursor="Fel">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-signal text-ink transition-transform duration-500 group-hover:rotate-[-8deg]">
            <BusFront className="h-5 w-5" />
          </span>
          <span className="text-sm font-black uppercase tracking-tight [font-stretch:125%]">
            Volánbusz <span className="text-signal">Nyrt.</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] md:flex">
          <a href="#csapat" className="group relative text-paper/70 transition-colors hover:text-paper">
            <span className="mr-2 text-signal">01</span>Munkatársak
            <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-signal transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
          </a>
          <a href="#missions" className="group relative text-paper/70 transition-colors hover:text-paper">
            <span className="mr-2 text-fail">02</span>Mission Impossible
            <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-fail transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
          </a>
        </nav>

        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70">
          <span className="hidden sm:inline">Budapest</span>
          <Clock className="tabular-nums text-signal" />
        </div>
      </div>

      {/* útvonal-csík */}
      <div className="relative mx-4 h-6 sm:mx-8">
        <div className="absolute inset-x-0 top-1 h-px bg-paper/15" />
        <motion.div className="absolute left-0 top-1 h-px origin-left bg-signal" style={{ scaleX: progress, width: '100%' }} />
        {stopsAt.map((s, i) => (
          <a
            key={sections[i].id}
            href={`#${sections[i].id}`}
            className="group absolute top-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s * 100}%` }}
            aria-label={sections[i].label}
          >
            <span
              className={`block h-[7px] w-[7px] rounded-full border transition-colors duration-300 ${
                i <= active ? 'border-signal bg-signal' : 'border-paper/40 bg-ink'
              }`}
            />
            <span
              className={`absolute top-3 hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] transition-colors lg:block ${
                i === active ? 'text-signal' : 'text-paper/35 group-hover:text-paper/70'
              } ${i === 0 ? 'left-0' : i === stopsAt.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
            >
              {sections[i].label}
            </span>
          </a>
        ))}
        <motion.div className="pointer-events-none absolute top-1 -translate-x-1/2 -translate-y-1/2" style={{ left: busLeft }}>
          <span className="grid h-4 w-7 place-items-center rounded-[4px] bg-signal text-ink shadow-[0_0_18px_rgba(255,208,0,0.55)]">
            <span className="flex gap-[2px]">
              <span className="h-[5px] w-[4px] rounded-[1px] bg-ink/80" />
              <span className="h-[5px] w-[4px] rounded-[1px] bg-ink/80" />
              <span className="h-[5px] w-[4px] rounded-[1px] bg-ink/80" />
            </span>
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
}
