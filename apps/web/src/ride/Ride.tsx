// The four-beat orchestrator: 出会う → わかる → ためす → 到着. Order is
// enforced structurally — each screen's own continue action is the only path
// forward (architecture §4).
import { Encounter } from './Encounter.js';
import { Understand } from './Understand.js';
import { Practice } from './Practice.js';
import { Arrival } from './Arrival.js';
import { useRide } from './useRide.js';
import type { CharacterBundle } from '../published/types.js';

function beatScreen(
  beat: ReturnType<typeof useRide>['beat'],
  char: CharacterBundle,
  ride: ReturnType<typeof useRide>,
) {
  const { sessionId, setBeat, progress, apply } = ride;
  switch (beat) {
    case 'encounter':
      return (
        <Encounter
          char={char}
          onContinue={() => {
            void apply({ type: 'encounter', at: Date.now(), sessionId }).then(() => setBeat('understand'));
          }}
        />
      );
    case 'understand':
      return (
        <Understand
          char={char}
          onContinue={() => {
            void apply({ type: 'understand', at: Date.now(), sessionId }).then(() => setBeat('practice'));
          }}
        />
      );
    case 'practice':
      return <Practice char={char} sessionId={sessionId} onAnswer={apply} onComplete={() => setBeat('arrival')} />;
    case 'arrival':
      // progress is guaranteed set by the time arrival is reached: practice
      // always calls apply() at least once before onComplete (every character
      // in this content set has at least one item).
      return progress === null ? null : <Arrival progress={progress} onRideAgain={() => setBeat('encounter')} />;
    default: {
      const _exhaustive: never = beat;
      throw new Error(`unreachable beat: ${String(_exhaustive)}`);
    }
  }
}

export function Ride({ char }: { char: CharacterBundle }) {
  const ride = useRide(char.character);
  return (
    <>
      {/* One stable page heading across all four beats, for screen readers —
          not shown visually, since each beat already carries the character
          as its own large visual focus (a duplicate visible heading would be
          redundant, not helpful). */}
      <h1 className="sr-only">{char.character}</h1>
      {beatScreen(ride.beat, char, ride)}
    </>
  );
}
