// src/components/Gatekeeper.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Gatekeeper() {
  const [input, setInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  // Amíg le van zárva, ne lehessen görgetni az oldalon
  useEffect(() => {
    if (!isUnlocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isUnlocked]);

  const checkPassword = () => {
    if (input === 'Mezek') {
      setIsUnlocked(true);
    } else {
      setError(true);
      // Kis idő múlva levesszük a piros keretet
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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-4"
        >
          {/* Lisan al-Gaib felirat */}
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-700 tracking-widest uppercase text-center"
          >
            Lisan al-Gaib
          </motion.h1>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md flex flex-col gap-4"
          >
            {/* Input mező */}
            <motion.input
              type="password"
              placeholder="Jelszó..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}} // Remegés ha hibás
              transition={{ type: "spring", stiffness: 300 }}
              className={`w-full px-6 py-4 text-center text-xl bg-slate-900 rounded-full border-2 outline-none transition-all placeholder-slate-600
                ${error ? 'border-red-500 text-red-500' : 'border-slate-700 focus:border-yellow-500 text-yellow-400'}
              `}
            />

            {/* Belépés gomb */}
            <button
              onClick={checkPassword}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold text-lg rounded-full transition-colors uppercase tracking-wider"
            >
              Belépés
            </button>
          </motion.div>
          
          <p className="mt-8 text-slate-600 text-sm italic">Csak a kiválasztottak léphetnek be.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}