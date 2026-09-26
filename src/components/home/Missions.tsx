'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import MissionCard from '@/components/home/MissionCard';
import { missions } from '@/lib/content';

const TILTS = [-2.2, 1.6, -1.2, 2, -1.6, 1.2, -0.6];

export default function Missions() {
  const [revealed, setRevealed] = useState(0);
  const done = revealed === missions.length;
  const failed = missions.filter((m) => m.status === 'Failed').length;

  return (
    <section id="missions" className="relative overflow-hidden border-t border-line bg-ink px-4 py-24 sm:px-8 md:py-36">
      {/* halvány piros háttérfény */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,59,47,0.12),transparent_65%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50">
          <span className="text-fail">(02)</span>
          <span className="h-px w-10 bg-paper/25" />
          Küldetések
        </div>

        {/* bélyegzőként becsapódó cím */}
        <div className="flex justify-center py-6 md:py-10">
          <motion.h2
            initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
            viewport={{ once: true, margin: '-25% 0px' }}
            transition={{ type: 'spring', stiffness: 260, damping: 17, mass: 1.2 }}
            className="select-none rounded-[10px] border-[5px] border-dashed border-fail px-4 py-3 text-center text-[clamp(2rem,8.4vw,10rem)] font-black uppercase leading-[0.85] tracking-tight text-fail [filter:url(#stamp-ink)] [font-stretch:125%] sm:border-[10px] sm:px-10 sm:py-6"
          >
            Mission
            <br />
            Impossible
          </motion.h2>
        </div>

        {/* számláló */}
        <div className="mx-auto mb-16 mt-10 flex max-w-xl flex-col items-center gap-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-paper/50 md:mb-24">
          <div className="flex items-center gap-3">
            Kiértékelve
            <span className="tabular-nums text-paper">
              {revealed} / {missions.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {missions.map((m, i) => (
              <span
                key={m.title}
                className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${
                  i < revealed ? (done ? (m.status === 'Failed' ? 'bg-fail' : 'bg-ok') : 'bg-signal') : 'bg-paper/15'
                }`}
              />
            ))}
          </div>
          {done && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-paper">
              <span className="text-fail">{failed} Failed</span> · <span className="text-ok">{missions.length - failed} Accomplished</span>
            </motion.div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-x-10 gap-y-14 md:gap-y-20">
          {missions.map((mission, i) => (
            <MissionCard
              key={mission.title}
              index={i}
              total={missions.length}
              title={mission.title}
              img={mission.img}
              status={mission.status}
              tilt={TILTS[i % TILTS.length]}
              onReveal={() => setRevealed((n) => n + 1)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
