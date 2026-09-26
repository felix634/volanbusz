'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import SplitFlap from '@/components/ui/SplitFlap';
import Magnetic from '@/components/ui/Magnetic';
import Clock from '@/components/ui/Clock';
import { ArrowDown } from '@/components/ui/Icons';
import { useGateUnlocked } from '@/lib/gate';

const EXPO = [0.16, 1, 0.3, 1] as const;
const CTA = 'Ismerd meg a csapatot';

function CircleCta() {
  const r = 62;
  const circ = 2 * Math.PI * r;
  const ring = `${CTA} • ${CTA} • `.toUpperCase();
  return (
    <Magnetic strength={0.4}>
      <a
        href="#csapat"
        aria-label={CTA.toUpperCase()}
        data-cursor="Indulás"
        className="group relative grid h-[118px] w-[118px] place-items-center rounded-full sm:h-[140px] sm:w-[140px] md:h-[calc(var(--hero-size)*0.8)] md:w-[calc(var(--hero-size)*0.8)]"
      >
        <svg viewBox="0 0 150 150" className="absolute inset-0 h-full w-full animate-spin-slow group-hover:[animation-duration:5s]">
          <defs>
            <path id="cta-circle" d={`M75,75 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} />
          </defs>
          <text className="fill-paper font-mono text-[10.5px] font-bold tracking-[0.12em]">
            <textPath href="#cta-circle" textLength={circ - 4} lengthAdjust="spacing">
              {ring}
            </textPath>
          </text>
        </svg>
        <span className="grid h-[52%] w-[52%] place-items-center rounded-full bg-signal text-ink shadow-[0_0_50px_rgba(255,208,0,0.35)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.18]">
          <ArrowDown className="h-7 w-7 transition-transform duration-500 group-hover:translate-y-1" />
        </span>
      </a>
    </Magnetic>
  );
}

// Szembejövő busz: a perspektivikus út "belsejéből" közeledik (translateZ),
// így pontosan az út enyészpontjából indul.
function OncomingBus() {
  return (
    <div className="oncoming absolute bottom-[4%] left-[calc(50%-min(190px,23vw))] w-[min(250px,30vw)] -translate-x-1/2">
      <svg viewBox="0 0 240 230" className="block w-full overflow-visible">
        <defs>
          <radialGradient id="hl" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6cf" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#ffd000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffd000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff6cf" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff6cf" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* fénycsóva az úton */}
        <path d="M30 205 L-40 330 L280 330 L210 205 Z" fill="url(#beam)" />
        {/* karosszéria */}
        <rect x="10" y="8" width="220" height="194" rx="24" fill="#e9e4d6" />
        {/* célállomás kijelző */}
        <rect x="30" y="20" width="180" height="28" rx="4" fill="#0b0b0a" />
        <text x="120" y="40" textAnchor="middle" fontFamily="monospace" fontSize="15" fontWeight="700" fill="#ffd000" letterSpacing="1.5">
          01 TELEPHELY
        </text>
        {/* szélvédő */}
        <rect x="22" y="56" width="196" height="86" rx="12" fill="#17222c" />
        <path d="M44 136 L104 62 L132 62 L72 136 Z" fill="#fff" opacity="0.07" />
        <rect x="100" y="120" width="40" height="20" rx="4" fill="#0e151b" />
        {/* sárga csík */}
        <rect x="10" y="150" width="220" height="12" fill="#ffd000" />
        {/* lökhárító + kerekek */}
        <rect x="4" y="196" width="232" height="16" rx="6" fill="#2a2a27" />
        <rect x="24" y="208" width="32" height="18" rx="5" fill="#0b0b0a" />
        <rect x="184" y="208" width="32" height="18" rx="5" fill="#0b0b0a" />
        {/* fényszórók */}
        <circle cx="44" cy="180" r="42" fill="url(#hl)" />
        <circle cx="196" cy="180" r="42" fill="url(#hl)" />
        <circle cx="44" cy="180" r="10" fill="#fffbe8" />
        <circle cx="196" cy="180" r="10" fill="#fffbe8" />
      </svg>
    </div>
  );
}

export default function Hero() {
  const unlocked = useGateUnlocked();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const roadScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);

  const show = (delay: number) => ({
    initial: { opacity: 0, y: 30 },
    animate: unlocked ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
    transition: { delay: unlocked ? delay : 0, duration: 1.1, ease: EXPO },
  });

  return (
    <section
      id="telephely"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden px-4 pb-8 pt-28 sm:px-8 sm:pb-10"
    >
      {/* fényszóró izzás */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,rgba(255,208,0,0.16),transparent_70%)]" />

      {/* perspektivikus út mozgó felezővonallal */}
      <motion.div
        aria-hidden
        style={{ scale: roadScale }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[84%] origin-bottom overflow-hidden [perspective:420px] [perspective-origin:50%_0%]"
      >
        <div className="road-plane animate-road absolute bottom-0 left-1/2 h-[420%] w-[min(760px,92vw)] -translate-x-1/2 origin-bottom [transform:rotateX(76deg)]" />
        {unlocked && <OncomingBus />}
        <div className="absolute inset-0 bg-gradient-to-b from-ink from-[4%] via-ink/0 via-[32%] to-ink/20" />
      </motion.div>

      <motion.div style={{ y: titleY, opacity: fade }} className="relative z-10">
        {/* indulási tábla */}
        <motion.div
          {...show(1.5)}
          className="mb-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-line py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60 sm:grid-cols-4 sm:text-[11px]"
        >
          <div>
            <div className="text-paper/35">Járat</div>
            <div className="text-paper">01</div>
          </div>
          <div>
            <div className="text-paper/35">Útirány</div>
            <div className="text-paper">Telephely → Végállomás</div>
          </div>
          <div>
            <div className="text-paper/35">Indulás</div>
            <Clock className="tabular-nums text-signal" />
          </div>
          <div>
            <div className="text-paper/35">Késés</div>
            <div className="animate-blink text-signal">~ ∞ perc</div>
          </div>
        </motion.div>

        <div className="relative [--hero-size:calc(100cqi*0.1185)] @container">
          <h1 className="font-black uppercase leading-[0.8] tracking-[-0.02em] [font-stretch:125%]">
            <SplitFlap
              text="VOLÁNBUSZ"
              play={unlocked}
              delay={0.95}
              stagger={0.07}
              className="block whitespace-nowrap text-[length:var(--hero-size)] text-signal"
              charClassName="flap-seam"
            />
            <SplitFlap
              text="NYRT."
              play={unlocked}
              delay={1.45}
              stagger={0.07}
              className="mt-[0.04em] inline-block whitespace-nowrap text-[length:var(--hero-size)] text-paper"
              charClassName="flap-seam"
            />
          </h1>

          <div className="mt-6 flex items-end justify-between gap-4 sm:mt-8 sm:gap-6 md:absolute md:bottom-0 md:right-0 md:mt-0 md:w-[45%]">
            <motion.p
              {...show(2)}
              className="max-w-[22rem] text-base font-medium leading-snug text-paper/70 sm:text-xl md:text-[clamp(1rem,1.45vw,1.45rem)]"
            >
              A hivatalos baráti társaság, ahol a menetrend csak tájékoztató jellegű.
            </motion.p>
            <motion.div
              initial={{ scale: 0, rotate: -120 }}
              animate={unlocked ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -120 }}
              transition={{ delay: unlocked ? 2.2 : 0, duration: 1.2, ease: EXPO }}
              className="shrink-0"
            >
              <CircleCta />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
