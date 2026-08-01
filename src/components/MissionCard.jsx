// src/components/MissionCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionCard({ title, img, status }) {
  // Ez az állapot figyeli, hogy rákattintottak-e már a kártyára
  const [isRevealed, setIsRevealed] = useState(false);
  const isFailed = status === 'Failed';

  // Animáció a pecsét "beütéséhez"
  const stampAnimation = {
    hidden: { opacity: 0, scale: 1.5, rotate: -20 },
    visible: { 
      opacity: 0.9, 
      scale: 1, 
      rotate: -12,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 15,
        mass: 1.2
      }
    }
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

        {/* A PECSÉT RÉTEG */}
        <AnimatePresence>
          {isRevealed && (
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4 overflow-hidden">
              {isFailed ? (
                // --- FAILED ESET (Kép használata) ---
                <motion.img
                  src="/stamp_failed.png" // A beküldött piros pecsét kép
                  alt="FAILED"
                  variants={stampAnimation}
                  initial="hidden"
                  animate="visible"
                  className="w-full max-w-[80%] object-contain drop-shadow-lg select-none pointer-events-none mix-blend-hard-light"
                />
              ) : (
                // --- SUCCESS ESET (CSS Stamp) ---
                <motion.div
                  variants={stampAnimation}
                  initial="hidden"
                  animate="visible"
                  // Egyedi CSS a zöld, grunge stílusú pecséthez
                  className="border-[6px] border-dashed border-green-600 text-green-600 font-black text-3xl md:text-4xl uppercase p-4 tracking-widest -rotate-12 select-none pointer-events-none opacity-80 mix-blend-plus-lighter"
                  style={{ 
                    maskImage: 'url(/stamp_failed.png)', // Trükk: a piros kép textúráját használjuk maszkként a zöldhöz is!
                    maskSize: 'cover'
                  }}
                >
                  SUCCESS
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