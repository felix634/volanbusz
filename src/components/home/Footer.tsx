'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowUpRight, BusSide, SteeringWheel } from '@/components/ui/Icons';

// A Lisan al-Gaib figyel téged – a pupilla követi a kurzort
function WatchingEye() {
  const ref = useRef<SVGSVGElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const x = useSpring(px, { stiffness: 250, damping: 20 });
  const y = useSpring(py, { stiffness: 250, damping: 20 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const a = Math.atan2(dy, dx);
      const d = Math.min(1, Math.hypot(dx, dy) / 300);
      px.set(Math.cos(a) * 5 * d);
      py.set(Math.sin(a) * 2.6 * d);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [px, py]);

  return (
    <svg ref={ref} viewBox="0 0 32 18" className="h-[18px] w-8 shrink-0" aria-hidden>
      <path d="M1 9C5 2.5 10 1 16 1s11 1.5 15 8c-4 6.5-9 8-15 8S5 15.5 1 9Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <motion.g style={{ x, y }}>
        <circle cx="16" cy="9" r="4.6" fill="#1f5fbf" />
        <circle cx="16" cy="9" r="2" fill="#0b0b0a" />
      </motion.g>
    </svg>
  );
}

function RouteTile({
  href,
  title,
  kicker,
  icon,
  index,
}: {
  href: string;
  title: string;
  kicker: string;
  icon: React.ReactNode;
  index: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      data-cursor="Beszállás"
      className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[22px] border border-line bg-ink-2 p-6 transition-colors duration-500 hover:border-signal sm:min-h-[240px] sm:p-8"
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-signal transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-y-100" />
      <div className="relative flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-paper/45 transition-colors duration-500 group-hover:text-ink/60">
        <span>{kicker}</span>
        <span>{index}</span>
      </div>
      <div className="relative flex items-end justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="text-signal transition-all duration-700 group-hover:-rotate-12 group-hover:text-ink">{icon}</span>
          <span className="text-[clamp(1.6rem,3.2vw,3rem)] font-black uppercase leading-[0.9] tracking-tight text-paper transition-colors duration-500 [font-stretch:115%] group-hover:text-ink">
            {title}
          </span>
        </div>
        <ArrowUpRight className="h-8 w-8 shrink-0 text-paper/40 transition-all duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink" />
      </div>
    </Link>
  );
}

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const wordY = useTransform(scrollYProgress, [0.2, 1], ['55%', '0%']);

  return (
    <footer id="vegallomas" ref={ref} className="relative overflow-hidden border-t border-line bg-ink px-4 pt-24 sm:px-8 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">
          <span className="text-signal">(03)</span>
          <span className="h-px w-10 bg-paper/25" />
          Végállomás · Átszállási lehetőség
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <RouteTile
            href="/game"
            title="Indul a járat..."
            kicker="Volán Kaland"
            index="Peron A"
            icon={<BusSide className="h-12 w-12 sm:h-16 sm:w-16" />}
          />
          <RouteTile
            href="/simulator"
            title="Ülj a volán mögé..."
            kicker="Járatvezetés"
            index="Peron B"
            icon={<SteeringWheel className="h-12 w-12 sm:h-16 sm:w-16" />}
          />
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 text-sm text-paper/50 md:flex-row md:items-center md:justify-between md:text-base">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Volánbusz Nyrt. Minden jog fenntartva.</p>
          <p className="flex items-center gap-3 text-xs text-paper/40 md:text-sm">
            <WatchingEye />
            Nem állunk kapcsolatban a valódi Volánbusszal (sajnos). A Lisan al-Gaib figyel téged.
          </p>
        </div>
      </div>

      {/* óriás szóvédjegy */}
      <div aria-hidden className="pointer-events-none mt-6 select-none overflow-hidden pt-[3vw] @container">
        <motion.div
          style={{ y: wordY }}
          className="whitespace-nowrap text-center text-[length:calc(100cqi*0.1225)] font-black uppercase leading-[0.8] tracking-[-0.03em] text-signal [font-stretch:125%]"
        >
          Volánbusz
        </motion.div>
      </div>
    </footer>
  );
}
