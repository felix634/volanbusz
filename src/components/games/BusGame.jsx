'use client';

// src/components/games/BusGame.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function BusGame() {
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);

  const busRef = useRef(null);
  const obstacleRef = useRef(null);

  const jump = useCallback(() => {
    if (!isJumping && isGameRunning && !isGameOver) {
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
    }
  }, [isJumping, isGameRunning, isGameOver]);

  const startGame = () => {
    setIsGameRunning(true);
    setIsGameOver(false);
    setScore(0);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        if (!isGameRunning && !isGameOver) {
            startGame();
        } else {
            jump();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [jump, isGameRunning, isGameOver]);

  useEffect(() => {
    let collisionInterval;
    let scoreInterval;

    if (isGameRunning && !isGameOver) {
      scoreInterval = setInterval(() => {
        setScore(prev => prev + 1);
      }, 1000);

      collisionInterval = setInterval(() => {
        const bus = busRef.current;
        const obstacle = obstacleRef.current;

        if (bus && obstacle) {
          const busRect = bus.getBoundingClientRect();
          const obstacleRect = obstacle.getBoundingClientRect();

          // Kicsit engedékenyebb ütközésvizsgálat (inset)
          // Hogy ne halj meg ha csak 1 pixellel súrolod
          const buffer = 4; 
          
          const isColliding = !(
            busRect.right - buffer < obstacleRect.left + buffer ||
            busRect.left + buffer > obstacleRect.right - buffer ||
            busRect.bottom - buffer < obstacleRect.top + buffer ||
            busRect.top + buffer > obstacleRect.bottom - buffer
          );

          if (isColliding) {
            setIsGameOver(true);
            setIsGameRunning(false);
          }
        }
      }, 10);
    }

    return () => {
      clearInterval(collisionInterval);
      clearInterval(scoreInterval);
    };
  }, [isGameRunning, isGameOver]);

  return (
    <div 
        className="relative w-full max-w-2xl h-64 rounded-t-2xl border border-b-4 border-line border-b-signal bg-ink-2/80 overflow-hidden touch-none select-none shadow-[0_40px_120px_-40px_rgba(255,208,0,0.25)]" 
        onClick={jump}
    >
      <div className="absolute top-3 right-4 text-signal font-mono text-xl tabular-nums z-10">
        Score: {score.toString().padStart(4, '0')}
      </div>

      {(!isGameRunning || isGameOver) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/85 backdrop-blur-sm z-20 text-paper">
          {isGameOver ? (
            <>
              <h2 className="text-3xl font-black text-fail mb-2 tracking-tight [font-stretch:120%]">A JÁRAT KISIKLOTT!</h2>
              <p className="mb-5 font-mono text-sm text-paper/70">Végső pontszám: {score}</p>
            </>
          ) : (
            <p className="text-xl font-bold mb-5">Készen állsz a műszakra?</p>
          )}
          <button 
            onClick={startGame}
            className="px-8 py-3 bg-signal text-ink font-black tracking-[0.15em] rounded-full hover:bg-paper transition-colors active:scale-95"
          >
            {isGameOver ? 'ÚJRAINDÍTÁS' : 'INDÍTÁS'}
          </button>
        </div>
      )}

      {/* A BUSZ */}
      <div
        ref={busRef}
        className={`absolute bottom-0 left-10 w-16 h-10 bg-yellow-500 rounded-sm flex items-center justify-center border-2 border-yellow-600
            ${isJumping ? 'animate-bus-jump' : ''} 
            ${isGameOver ? 'bg-red-500 border-red-700' : ''}
        `}
      >
        <div className="flex gap-1 absolute top-1 left-1">
            <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
        </div>
        <div className="absolute -bottom-2 left-2 w-3 h-3 bg-black rounded-full"></div>
        <div className="absolute -bottom-2 right-2 w-3 h-3 bg-black rounded-full"></div>
        <span className="text-[8px] font-bold text-slate-900 mt-4 ml-2">VOLÁN</span>
      </div>

      {/* AZ AKADÁLY (Kocka) - KISEBB LETT! */}
      <div
        ref={obstacleRef}
        // w-6 (24px) és h-8 (32px) - sokkal barátibb méret
        className={`absolute bottom-0 -right-8 w-6 h-8 bg-red-700 rounded-sm border-2 border-red-900
            ${isGameRunning ? 'animate-obstacle-move' : ''}
        `}
        style={{ animationPlayState: isGameRunning ? 'running' : 'paused' }}
      ></div>
    </div>
  );
}