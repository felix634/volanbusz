import Marquee from '@/components/ui/Marquee';
import { BusFront } from '@/components/ui/Icons';
import { stops } from '@/lib/content';

// Sárga futószalag a járat megállóival (enyhén megdöntve)
export default function StopsBand() {
  return (
    <div className="relative z-20 -my-6 overflow-hidden py-10" aria-hidden>
      <div className="-rotate-2 bg-signal py-3 text-ink shadow-[0_20px_60px_-20px_rgba(255,208,0,0.45)] sm:py-4">
        <Marquee baseVelocity={2.2}>
          {stops.map((s) => (
            <span
              key={s}
              className="flex items-center gap-6 pr-6 text-[clamp(1.6rem,4.2vw,4rem)] font-black uppercase leading-none tracking-tight [font-stretch:125%] sm:gap-10 sm:pr-10"
            >
              {s}
              <BusFront className="h-[0.7em] w-[0.7em] shrink-0" />
            </span>
          ))}
        </Marquee>
      </div>
      <div className="absolute inset-x-0 top-1/2 -z-10 rotate-[1.5deg] border-y border-paper/10 bg-ink-2 py-2">
        <Marquee baseVelocity={-1.4}>
          {stops.map((s) => (
            <span key={s} className="pr-8 font-mono text-[11px] uppercase tracking-[0.3em] text-paper/40">
              Következő megálló: {s} ·
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
