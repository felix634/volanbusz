import Link from 'next/link';
import { ArrowLeft, BusFront } from '@/components/ui/Icons';
import Clock from '@/components/ui/Clock';

type Props = {
  kicker: string;
  title: string;
  lead?: string;
  cross: { href: string; label: string };
  children: React.ReactNode;
  fixedHeight?: boolean;
};

// Közös keret a játékoldalakhoz
export default function GameShell({ kicker, title, lead, cross, children, fixedHeight }: Props) {
  return (
    <main
      className={`relative flex w-full flex-col items-center overflow-hidden bg-ink px-4 ${
        fixedHeight ? 'h-[100svh] justify-center' : 'min-h-[100svh] justify-center py-24'
      }`}
    >
      {/* háttér rács */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-paper)_1px,transparent_1px),linear-gradient(90deg,var(--color-paper)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,208,0,0.1),transparent_70%)]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="group flex items-center gap-3 text-signal">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-signal/40 transition-colors group-hover:bg-signal group-hover:text-ink">
            <ArrowLeft className="h-5 w-5" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Vissza a telephelyre</span>
        </Link>
        <Link
          href={cross.href}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/50 transition-colors hover:text-signal"
        >
          {cross.label} &rarr;
        </Link>
      </header>

      <div className="relative z-10 mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/45 sm:text-[11px]">
        <BusFront className="h-4 w-4 text-signal" />
        {kicker}
        <span className="text-paper/25">·</span>
        <Clock className="tabular-nums text-signal" />
      </div>
      <h1 className="relative z-10 text-center text-[clamp(2.4rem,8vw,6.5rem)] font-black uppercase leading-[0.85] tracking-tight text-signal [font-stretch:125%]">
        {title}
      </h1>
      {lead && <p className="relative z-10 mt-4 max-w-lg text-center text-sm text-paper/55">{lead}</p>}

      <div className="relative z-10 mt-8 flex w-full flex-col items-center">{children}</div>
    </main>
  );
}
