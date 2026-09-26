'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import MemberCard from '@/components/home/MemberCard';
import { members } from '@/lib/content';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
}

// Desktopon a kártyasor vízszintesen úszik be, miközben
// függőlegesen görgetünk (rögzített, "sticky" nézet).
export default function Crew() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const desktop = useIsDesktop();
  const distance = useMotionValue(0);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!desktop || !trackRef.current) {
      setHeight(null);
      distance.set(0);
      return;
    }
    const track = trackRef.current;
    const measure = () => {
      const d = Math.max(0, track.scrollWidth - window.innerWidth);
      distance.set(d);
      setHeight(d + window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [desktop, distance]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  // mobilon a távolság 0, így ott nincs vízszintes elmozdulás
  const x = useTransform(() => -scrollYProgress.get() * distance.get());
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });

  return (
    <section
      id="csapat"
      ref={sectionRef}
      className="relative bg-ink"
      style={{ height: desktop && height ? height : undefined }}
    >
      <div className="flex flex-col py-20 lg:sticky lg:top-0 lg:h-screen lg:justify-center lg:overflow-hidden lg:py-0">
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max max-w-none flex-col items-center gap-10 px-4 will-change-transform max-lg:w-full sm:px-8 lg:flex-row lg:items-center lg:gap-[3vw] lg:pl-[6vw] lg:pr-[10vw]"
        >
          {/* cím panel */}
          <div className="w-full shrink-0 self-start pt-6 lg:w-[40vw] lg:self-center lg:pt-0">
            <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">
              <span className="text-signal">(01)</span>
              <span className="h-px w-10 bg-paper/25" />
              Személyzet
            </div>
            <h2 className="text-[clamp(3rem,6vw,8rem)] font-black uppercase leading-[0.82] tracking-tight [font-stretch:125%]">
              <span className="block text-paper">A</span>
              <span className="block text-signal">Munka&shy;társak</span>
            </h2>
            <p className="mt-8 hidden max-w-xs font-mono text-[11px] uppercase leading-relaxed tracking-[0.15em] text-paper/45 lg:block">
              {members.length} fő · görgess tovább →
            </p>
          </div>

          {members.map((m, i) => (
            <div key={m.name} className={i % 2 ? 'lg:translate-y-[4vh]' : 'lg:-translate-y-[3vh]'}>
              <MemberCard
                index={i}
                total={members.length}
                name={m.name}
                imgNormal={m.imgNormal}
                imgFunny={m.imgFunny}
                description={m.desc}
              />
            </div>
          ))}
        </motion.div>

        {/* haladásjelző */}
        <div className="pointer-events-none absolute inset-x-[6vw] bottom-8 hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40 lg:flex">
          <span>Telephely</span>
          <div className="relative h-px flex-1 bg-paper/15">
            <motion.div className="absolute inset-0 origin-left bg-signal" style={{ scaleX: bar }} />
          </div>
          <span>Végállomás</span>
        </div>
      </div>
    </section>
  );
}
