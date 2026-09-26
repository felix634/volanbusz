import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import BusGame from '@/components/games/BusGame';

export const metadata: Metadata = {
  title: 'Volánbusz Kaland - Titkos Játék',
};

export default function GamePage() {
  return (
    <GameShell kicker="Titkos játék" title="Volán Kaland" cross={{ href: '/simulator', label: 'Busz szimulátor' }} fixedHeight>
      <BusGame />
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.15em] text-paper/40">Ugrás: SPACE vagy Kattintás/Érintés</p>
    </GameShell>
  );
}
