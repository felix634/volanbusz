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
    <div className="w-full max-w-sm h-[450px] cursor-pointer perspective-1000" onClick={handleFlip}>
      <motion.div
        className="relative w-full h-full text-center"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, animationDirection: "normal" }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* FRONT SIDE (Sima) */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-yellow-500/20 bg-slate-900 group hover:border-yellow-400 transition-colors">
          <div className="h-3/4 overflow-hidden">
             {/*  - A felhasználó saját képei lesznek itt */}
            <img 
              src={imgNormal} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="h-1/4 flex flex-col justify-center items-center bg-slate-800 p-4">
            <h3 className="text-2xl font-bold text-yellow-400">{name}</h3>
            <p className="text-slate-400 text-sm mt-1">Kattints a titkos énemért!</p>
          </div>
        </div>

        {/* BACK SIDE (Vicces) */}
        <div 
          className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl border-2 border-red-500 bg-red-900/20"
          style={{ transform: "rotateY(180deg)" }}
        >
             {/*  - A felhasználó saját képei lesznek itt */}
          <img 
            src={imgFunny} 
            alt={`${name} vicces`} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-0 w-full bg-black/70 p-4 backdrop-blur-sm">
            <h3 className="text-2xl font-black text-white">{name}</h3>
            <p className="text-yellow-300 font-bold italic">"{description}"</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}