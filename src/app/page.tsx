import Experience from '@/components/home/Experience';
import Gatekeeper from '@/components/home/Gatekeeper';
import Nav from '@/components/home/Nav';
import Hero from '@/components/home/Hero';
import StopsBand from '@/components/home/StopsBand';
import GroupPhoto from '@/components/home/GroupPhoto';
import Crew from '@/components/home/Crew';
import Missions from '@/components/home/Missions';
import Footer from '@/components/home/Footer';

export default function Home() {
  return (
    <Experience>
      <Gatekeeper />
      <Nav />
      <main className="relative w-full">
        <Hero />
        <StopsBand />
        <GroupPhoto />
        <Crew />
        <Missions />
      </main>
      <Footer />
    </Experience>
  );
}
