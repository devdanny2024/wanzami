'use client';

import { useEffect, useRef } from 'react';

/**
 * Plays a short Wanzami brand sound on app load without ever delaying or
 * competing with primary UI clicks like Login / Register.
 *
 * Source priority:
 * 1) NEXT_PUBLIC_STARTUP_SOUND_URL (recommended CDN URL)
 * 2) local /wanzami-surround.wav
 */
function resolveSoundUrl() {
  const direct = process.env.NEXT_PUBLIC_STARTUP_SOUND_URL?.trim();
  if (direct) return direct;
  return '/wanzami-surround.wav';
}

export function StartupSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attemptedPlay = useRef(false);

  useEffect(() => {
    const tryPlay = async () => {
      if (attemptedPlay.current) return;
      attemptedPlay.current = true;

      const audio = audioRef.current;
      if (!audio) return;

      try {
        audio.volume = 0.6;
        audio.muted = false;
        await audio.play();
      } catch {
        // Autoplay may be blocked by the browser. That's fine — the splash UI
        // must stay immediately clickable, so we do not hook into click/touch
        // events as a fallback.
      }
    };

    void tryPlay();
  }, []);

  return (
    <audio
      ref={audioRef}
      src={resolveSoundUrl()}
      preload="none"
      aria-hidden="true"
      className="hidden"
    />
  );
}
