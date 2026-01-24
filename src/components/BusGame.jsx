// src/components/BusGame.jsx
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
        className="relative w-full max-w-2xl h-64 border-b-4 border-slate-700 bg-slate-900/50 overflow-hidden touch-none select-none" 
        onClick={jump}
    >
      <div className="absolute top-2 right-4 text-yellow-500 font-mono text-xl z-10">
        Score: {score.toString().padStart(4, '0')}
      </div>

      {(!isGameRunning || isGameOver) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 text-white">
          {isGameOver ? (
            <>
              <h2 className="text-3xl font-bold text-red-500 mb-2">A JÁRAT KISIKLOTT!</h2>
              <p className="mb-4">Végső pontszám: {score}</p>
            </>
          ) : (
            <p className="text-xl mb-4">Készen állsz a műszakra?</p>
          )}
          <button 
            onClick={startGame}
            className="px-6 py-2 bg-yellow-500 text-slate-950 font-bold rounded-full hover:bg-yellow-400"
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