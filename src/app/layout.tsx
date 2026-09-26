import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Volánbusz Nyrt.',
  description: 'Volánbusz Nyrt. - A baráti társaság hivatalos oldala',
};

export const viewport: Viewport = {
  themeColor: '#0b0b0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body className="bg-ink font-sans text-paper antialiased">
        {children}

        {/* Közös SVG szűrők: gumibélyegző-textúra a pecsétekhez */}
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
          <filter id="stamp-ink" x="-10%" y="-10%" width="120%" height="120%">
            {/* kopott foltok (alacsony frekvencia) */}
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="4" seed="11" result="wear" />
            <feColorMatrix in="wear" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -16 0 0 0 11" result="wearMask" />
            {/* apró festékhiány (magas frekvencia) */}
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 9.6" result="grainMask" />
            <feComposite in="wearMask" in2="grainMask" operator="in" result="mask" />
            <feComposite in="SourceGraphic" in2="mask" operator="in" result="inked" />
            {/* egyenetlen szélek */}
            <feDisplacementMap in="inked" in2="grain" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        <div aria-hidden className="grain animate-grain" />
      </body>
    </html>
  );
}
