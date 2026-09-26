type P = { className?: string };

export function BusFront({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 3h12a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2Z" />
      <path d="M4 11h16M8 18v2M16 18v2M2 7v3M22 7v3" />
      <circle cx="8" cy="14.5" r=".6" fill="currentColor" />
      <circle cx="16" cy="14.5" r=".6" fill="currentColor" />
    </svg>
  );
}

// Az eredeti lábléc busz ikonja (Heroicons)
export function BusSide({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15ZM18.75 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H16.5a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75h2.25ZM5.25 7.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75H3a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75h2.25ZM3.75 18a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM17.25 18a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
    </svg>
  );
}

// Az eredeti lábléc kormány ikonja
export function SteeringWheel({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
      <path strokeLinecap="round" d="M12 14.6V21M9.6 11.2 3.4 9.6M14.4 11.2l6.2-1.6" />
    </svg>
  );
}

export function ArrowLeft({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

export function ArrowDown({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0 7.5-7.5M12 21l-7.5-7.5" />
    </svg>
  );
}

export function ArrowUpRight({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7m0 0H8m9 0v9" />
    </svg>
  );
}

// "Bökj rá" kéz ikon (mobil tipp a kártyákon)
export function Tap({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672 13.684 16.6m0 0-2.505-2.255a4.498 4.498 0 0 1 1.174-6.736 2.499 2.499 0 0 1 2.601 2.499c0 .463.155.897.418 1.25.105.14.394.395.772.696m-5.463 3.428-.485-.246A3 3 0 0 1 13.684 16.6m-3.235-4.527-.459-.229a3.001 3.001 0 0 1 2.37-5.483c.96.388 1.552 1.33 1.552 2.368 0 .462-.156.896-.42 1.25-.104.14-.393.395-.77.696m5.465 3.426.484.246a3 3 0 0 0-3.196-4.525"
      />
    </svg>
  );
}

export function Flip({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}
