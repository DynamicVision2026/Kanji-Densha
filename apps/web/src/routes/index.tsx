import { createFileRoute } from '@tanstack/react-router';
import { getCharacter } from '../published/load.js';
import { Ride } from '../ride/Ride.js';

// M3: the vertical slice rides exactly one character, 山, guest mode only.
// No route map (M5), no character selection — that is deliberately not this
// milestone's job.
const CHARACTER_ID = '山';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const char = getCharacter(CHARACTER_ID);
  if (char === undefined) {
    // Should not happen — content-dist always has 山 published (M2) — but a
    // silent blank screen would be worse than saying so.
    return <p style={{ padding: 20 }}>「{CHARACTER_ID}」が みつかりませんでした。</p>;
  }
  return <Ride char={char} />;
}
