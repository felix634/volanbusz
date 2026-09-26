'use client';

import { useSyncExternalStore } from 'react';

// A jelszókapu állapota modulszinten él, így kliens oldali navigáció
// után (játék -> vissza) nem kell újra beírni a jelszót.
let unlocked = false;
const listeners = new Set<() => void>();

export function unlockGate() {
  unlocked = true;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useGateUnlocked() {
  return useSyncExternalStore(
    subscribe,
    () => unlocked,
    () => false,
  );
}
