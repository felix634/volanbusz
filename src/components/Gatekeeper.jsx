import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Gatekeeper() {
  const [input, setInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isUnlocked]);

  const checkPassword = () => {
    // Kisbetű-nagybetű nem számít, a trimmelt verziót nézzük
    if (input.trim().toLowerCase() === 'mezek') {
      setIsUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  };

  return (
    <AnimatePresence>
      {!isUnlocked && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-6"
        >
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            // Reszponzív szövegméret: mobilon kisebb (text-3xl), gépen nagyobb
            className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-700 tracking-widest uppercase text-center break-words w-full"
          >
            Lisan al-Gaib
          </motion.h1>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs md:max-w-md flex flex-col gap-4"
          >
            <motion.input
              type="password"
              placeholder="Jelszó..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ type: "spring", stiffness: 300 }}
              // text-base vagy nagyobb kell mobilon, hogy ne zoomoljon be az iPhone!
              className={`w-full px-6 py-4 text-center text-lg md:text-xl bg-slate-900 rounded-full border-2 outline-none transition-all placeholder-slate-600
                ${error ? 'border-red-500 text-red-500' : 'border-slate-700 focus:border-yellow-500 text-yellow-400'}
              `}
            />

            <button
              onClick={checkPassword}
              // Active:scale-95 ad egy kis kattintás érzetet érintőképernyőn
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-slate-950 font-bold text-lg rounded-full transition-all uppercase tracking-wider"
            >
              Belépés
            </button>
          </motion.div>
          
          <p className="mt-8 text-slate-600 text-xs md:text-sm italic text-center px-4">
            Csak a kiválasztottak léphetnek be.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}