// src/components/MissionCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionCard({ title, img, status }) {
  // Ez az állapot figyeli, hogy rákattintottak-e már a kártyára
  const [isRevealed, setIsRevealed] = useState(false);
  const isFailed = status === 'Failed';

  // Animáció a pecsét "beütéséhez"
  const stampAnimation = {
    hidden: { opacity: 0, scale: 1.6, rotate: -26 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: -12,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15,
        mass: 1.2,
      },
    },
  };

  return (
    <div
      className="relative group cursor-pointer perspective-1000 flex flex-col items-center"
      onClick={() => setIsRevealed(true)} // Kattintásra felfedjük
    >
      <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-800 group-hover:border-yellow-500/50 transition-all">
        {/* ALAP KÉP */}
        <img
          src={img}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-500
            ${isRevealed ? 'grayscale contrast-125 brightness-50' : 'group-hover:scale-105'}`}
        />

        {/* A PECSÉT RÉTEG – tisztán CSS, hogy ne függjön külső képtől */}
        <AnimatePresence>
          {isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4 overflow-hidden">
              {isFailed ? (
                /* --- FAILED --- */
                <motion.div
                  variants={stampAnimation}
                  initial="hidden"
                  animate="visible"
                  className="shrink-0 select-none pointer-events-none border-[5px] border-red-500 rounded-sm px-4 py-1.5 text-center opacity-90 shadow-[0_0_0_3px_rgba(239,68,68,0.25)]"
                >
                  <span className="block whitespace-nowrap font-black uppercase leading-none tracking-[0.12em] text-red-500 text-3xl md:text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    Failed
                  </span>
                </motion.div>
              ) : (
                /* --- SUCCESS --- */
                <motion.div
                  variants={stampAnimation}
                  initial="hidden"
                  animate="visible"
                  className="shrink-0 select-none pointer-events-none border-[5px] border-green-500 rounded-sm px-3 py-1.5 text-center opacity-90 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]"
                >
                  <span className="block whitespace-nowrap font-black uppercase leading-none tracking-[0.26em] text-green-500 text-xs md:text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    Mission
                  </span>
                  <span className="mt-1 block whitespace-nowrap font-black uppercase leading-none tracking-[0.03em] text-green-500 text-lg md:text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                    Accomplished
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
      {/* CÍM A KÉP ALATT */}
      <h3 className="text-white font-bold mt-4 text-lg text-center">{title}</h3>
    </div>
  );
}
