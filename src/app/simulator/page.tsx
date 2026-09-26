import type { Metadata } from 'next';
import GameShell from '@/components/games/GameShell';
import BusSimulator from '@/components/games/BusSimulator';

export const metadata: Metadata = {
  title: 'Volánbusz Szimulátor - Járatvezetés',
};

export default function SimulatorPage() {
  return (
    <GameShell
      kicker="Szimulátor"
      title="Járatvezetés"
      lead="Te vagy a sofőr. Tartsd az útvonalat, és állj meg minden megállóban!"
      cross={{ href: '/game', label: 'Ugrálós játék' }}
    >
      <BusSimulator />
    </GameShell>
  );
}
