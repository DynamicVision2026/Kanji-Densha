// I10: a speaker renders only if its file is in the audio manifest — never a
// fallback, never a different reading. Plays only on user gesture (iOS Safari
// requires this; no autoplay on encounter — CLAUDE.md §6). Replayable; a new
// line stops whatever was already playing. Playback never touches progress
// (spec §7: does not call evaluateProgress) — this component has no store
// access at all, by construction.
import { useEffect, useRef, useState } from 'react';
import { audioFileExists } from '../published/load.js';

let currentlyPlaying: HTMLAudioElement | null = null;

export function Speaker({ file, label }: { file: string; label: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () => () => {
      if (currentlyPlaying === audioRef.current) currentlyPlaying = null;
    },
    [],
  );

  if (!audioFileExists(file)) return null; // I10: missing file hides the button, no fallback

  const play = () => {
    if (currentlyPlaying && currentlyPlaying !== audioRef.current) {
      currentlyPlaying.pause();
      currentlyPlaying.currentTime = 0;
    }
    let el = audioRef.current;
    if (el === null) {
      el = new Audio(`/audio/${file}`);
      audioRef.current = el;
      el.addEventListener('ended', () => setPlaying(false));
    }
    currentlyPlaying = el;
    setPlaying(true);
    void el.play();
  };

  return (
    <button
      type="button"
      onClick={play}
      aria-label={label}
      aria-pressed={playing}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
      style={{ background: 'var(--paper)', border: '1px solid var(--line)', minWidth: 44, minHeight: 44 }}
    >
      <span aria-hidden="true" style={{ fontSize: 20 }}>
        🔊
      </span>
    </button>
  );
}
