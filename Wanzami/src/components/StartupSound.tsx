'use client';

import { useEffect, useRef } from 'react';

/**
 * Plays a short Wanzami brand sound on app load with a graceful fallback:
 * - Attempts autoplay on mount.
 * - If blocked by the browser, waits for the first user interaction to play once.
 */
export function StartupSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const playSound = async () => {
      try {
        // Kick off load before play to reduce startup delay.
        audioRef.current?.load();
        await audioRef.current?.play();
        cleanup();
      } catch {
        // Likely blocked; wait for user interaction.
      }
    };

    const onUserGesture = () => {
      void playSound();
    };

    const onPointerMove = () => {
      void playSound();
    };

    const cleanup = () => {
      document.removeEventListener('click', onUserGesture);
      document.removeEventListener('keydown', onUserGesture);
      document.removeEventListener('touchstart', onUserGesture);
      document.removeEventListener('pointermove', onPointerMove);
    };

    // Try autoplay immediately.
    void playSound();

    // Fallback: listen for the first user gesture to trigger playback.
    document.addEventListener('click', onUserGesture, { once: true });
    document.addEventListener('keydown', onUserGesture, { once: true });
    document.addEventListener('touchstart', onUserGesture, { once: true });
    document.addEventListener('pointermove', onPointerMove, { once: true });

    return cleanup;
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/wanzami-surround.wav"
      preload="auto"
      aria-hidden="true"
      className="hidden"
    />
  );
}
