'use client';

import { MotionConfig, useReducedMotion } from 'framer-motion';
import { ReactLenis } from 'lenis/react';
import Cursor from '@/components/ui/Cursor';

// Főoldali "élmény réteg": sima görgetés (Lenis) + egyedi kurzor
export default function Experience({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: reduced ? 1 : 0.09, anchors: true, smoothWheel: !reduced }}>
        <Cursor />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
