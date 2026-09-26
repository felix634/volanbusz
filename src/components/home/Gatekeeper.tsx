'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLenis } from 'lenis/react';
import { unlockGate, useGateUnlocked } from '@/lib/gate';
import { playBuzz, playChime, playHiss } from '@/lib/sound';

const EASE = [0.76, 0, 0.24, 1] as const;
const TITLE = 'Lisan al-Gaib';

// Egy ajtószárny: sötét panel két "üvegmezővel" és sárga gumiszegéllyel
function DoorLeaf({ side, open }: { side: 'left' | 'right'; open: boolean }) {
  const isLeft = side === 'left';
  return (
    <motion.div
      className={`absolute top-0 h-full w-1/2 bg-ink-2 ${isLeft ? 'left-0' : 'right-0'}`}
      initial={false}
      animate={{ x: open ? (isLeft ? '-101%' : '101%') : '0%' }}
      transition={{ duration: 1.25, ease: EASE, delay: open ? 0.55 : 0 }}
    >
      {/* üvegmezők */}
      <div
        className={`absolute top-[7%] h-[40%] w-[62%] rounded-[28px] border border-paper/[0.07] bg-gradient-to-br from-paper/[0.035] to-transparent ${
          isLeft ? 'right-[12%]' : 'left-[12%]'
        }`}
      />
      <div
        className={`absolute bottom-[7%] h-[38%] w-[62%] rounded-[28px] border border-paper/[0.07] bg-gradient-to-br from-paper/[0.02] to-transparent ${
          isLeft ? 'right-[12%]' : 'left-[12%]'
        }`}
      />
      {/* kapaszkodó */}
      <div className={`absolute top-1/2 h-[26%] w-[6px] -translate-y-1/2 rounded-full bg-paper/10 ${isLeft ? 'right-[5%]' : 'left-[5%]'}`} />
      {/* gumiszegély + sárga él */}
      <div className={`absolute top-0 h-full w-[10px] bg-black ${isLeft ? 'right-0' : 'left-0'}`} />
      <div className={`absolute top-0 h-full w-[3px] bg-signal ${isLeft ? 'right-[10px]' : 'left-[10px]'}`} />
    </motion.div>
  );
}

export default function Gatekeeper() {
  const alreadyUnlocked = useGateUnlocked();
  const [phase, setPhase] = useState<'locked' | 'opening' | 'gone'>('locked');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lenis = useLenis();

  const visible = !alreadyUnlocked || phase === 'opening';

  // Amíg zárva van, nem lehet görgetni
  useEffect(() => {
    const locked = !alreadyUnlocked;
    document.documentElement.style.overflow = locked ? 'hidden' : '';
    if (locked) {
      lenis?.stop();
      window.scrollTo(0, 0);
    } else {
      lenis?.start();
    }
  }, [alreadyUnlocked, lenis]);

  useEffect(() => {
    if (!alreadyUnlocked) inputRef.current?.focus({ preventScroll: true });
  }, [alreadyUnlocked]);

  const checkPassword = () => {
    // Kisbetű-nagybetű nem számít, a trimmelt verziót nézzük
    if (input.trim().toLowerCase() === 'mezek') {
      inputRef.current?.blur();
      playChime();
      playHiss(0.5);
      setPhase('opening');
      unlockGate();
      window.setTimeout(() => setPhase('gone'), 2000);
    } else {
      playBuzz();
      setError(true);
      window.setTimeout(() => setError(false), 500);
    }
  };

  if (!visible) return null;

  const opening = phase === 'opening';

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden" aria-hidden={opening}>
      <DoorLeaf side="left" open={opening} />
      <DoorLeaf side="right" open={opening} />

      <AnimatePresence>
        {!opening && (
          <motion.div
            key="gate-ui"
            exit={{ opacity: 0, scale: 0.96, filter: 'blur(12px)' }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            {/* felső státuszsor */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted sm:px-8 sm:text-xs">
              <span>Volánbusz Nyrt.</span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-blink rounded-full bg-fail" />
                Ajtók zárva
              </span>
            </div>

            <h2
              aria-label={TITLE}
              className="mb-10 flex w-full flex-wrap justify-center gap-x-[0.28em] text-center text-[clamp(2.4rem,9.5vw,8.5rem)] font-black uppercase leading-[0.9] tracking-tight [font-stretch:115%]"
            >
              {TITLE.split(' ').map((word, w, words) => {
                const offset = words.slice(0, w).join(' ').length + (w ? 1 : 0);
                return (
                  <span key={w} aria-hidden className="inline-flex whitespace-nowrap">
                    {word.split('').map((ch, i) => (
                      <span
                        key={i}
                        className="gate-letter inline-block bg-gradient-to-b from-signal to-signal-deep bg-clip-text text-transparent"
                        style={{ animationDelay: `${0.15 + (offset + i) * 0.045}s` }}
                      >
                        {ch}
                      </span>
                    ))}
                  </span>
                );
              })}
            </h2>

            {/* CSS animációk: JS betöltése előtt is azonnal megjelennek */}
            <div className="gate-fade flex w-full max-w-sm flex-col gap-3 [animation-delay:0.7s] md:max-w-md">
              <motion.div
                animate={error ? { x: [-12, 12, -9, 9, -4, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
                className={`relative flex items-center rounded-full border bg-ink/80 backdrop-blur transition-colors ${
                  error ? 'border-fail' : 'border-paper/15 focus-within:border-signal'
                }`}
              >
                <span
                  className={`pointer-events-none absolute left-5 h-2 w-2 rounded-full transition-colors ${
                    error ? 'bg-fail' : input ? 'bg-signal' : 'bg-paper/25'
                  }`}
                />
                <input
                  ref={inputRef}
                  type="password"
                  placeholder="Jelszó..."
                  aria-label="Jelszó"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
                  // text-base vagy nagyobb kell mobilon, hogy ne zoomoljon be az iPhone!
                  className={`w-full bg-transparent px-12 py-4 text-center font-mono text-lg tracking-[0.3em] outline-none placeholder:tracking-[0.15em] placeholder:text-paper/30 md:text-xl ${
                    error ? 'text-fail' : 'text-signal'
                  }`}
                />
              </motion.div>

              <button
                onClick={checkPassword}
                data-cursor="Nyitás"
                className="group relative w-full overflow-hidden rounded-full bg-signal py-4 text-lg font-black uppercase tracking-[0.2em] text-ink transition-transform active:scale-[0.97] [font-stretch:120%]"
              >
                <span className="relative z-10">Belépés</span>
                <span className="absolute inset-0 -translate-x-full bg-paper transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0" />
              </button>
            </div>

            <p className="gate-fade mt-10 px-4 text-center text-xs italic text-muted [animation-delay:1.1s] md:text-sm">
              Csak a kiválasztottak léphetnek be.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
