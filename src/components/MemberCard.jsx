import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function MemberCard({ name, imgNormal, imgFunny, description }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (!isAnimating) {
      setIsFlipped(!isFlipped);
      setIsAnimating(true);
    }
  };

  return (
    // Reszponzív magasság: h-[400px] mobilon, h-[450px] tablettől felfelé
    <div className="w-full max-w-sm h-[400px] md:h-[450px] cursor-pointer perspective-1000 group touch-manipulation" onClick={handleFlip}>
      <motion.div
        className="relative w-full h-full text-center"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, animationDirection: "normal" }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT SIDE (Sima) */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-500/20 bg-slate-900 hover:border-yellow-400 transition-colors">
          <div className="h-3/4 overflow-hidden relative">
            <img 
              src={imgNormal} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
             {/* Vizulis segítség mobilon: egy kis kéz ikon jobb felül */}
             <div className="absolute top-3 right-3 bg-black/50 p-2 rounded-full md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.505-2.255a4.498 4.498 0 0 1 1.174-6.736 2.499 2.499 0 0 1 2.601 2.499c0 .463.155.897.418 1.25.105.14.394.395.772.696m-5.463 3.428-.485-.246A3 3 0 0 1 13.684 16.6m-3.235-4.527-.459-.229a3.001 3.001 0 0 1 2.37-5.483c.96.388 1.552 1.33 1.552 2.368 0 .462-.156.896-.42 1.25-.104.14-.393.395-.77.696m5.465 3.426.484.246a3 3 0 0 0-3.196-4.525" />
                </svg>
             </div>
          </div>
          <div className="h-1/4 flex flex-col justify-center items-center bg-slate-800 p-4">
            <h3 className="text-2xl font-bold text-yellow-400">{name}</h3>
            <p className="text-slate-400 text-xs md:text-sm mt-1">Kattints / Bökj a titokért!</p>
          </div>
        </div>

        {/* BACK SIDE (Vicces) */}
        <div 
          className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-red-500 bg-red-900/20"
          style={{ transform: "rotateY(180deg)" }}
        >
          <img 
            src={imgFunny} 
            alt={`${name} vicces`} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-0 w-full bg-black/70 p-4 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white">{name}</h3>
            <p className="text-yellow-300 font-bold italic text-sm md:text-base">"{description}"</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}