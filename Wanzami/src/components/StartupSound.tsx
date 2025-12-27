'use client';

import { useEffect, useRef } from 'react';

/**
 * Plays a short Wanzami brand sound on app load with a graceful fallback:
 * - Attempts autoplay on mount.
 * - If blocked by the browser, waits for the first user interaction to play once.
 */
export function StartupSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const playSound = async () => {
      if (hasPlayed.current) return;
      try {
        const audio = audioRef.current;
        if (!audio) return;

        // Allow autoplay by starting muted; we'll unmute on gesture.
        audio.muted = true;
        audio.volume = 0.6;
        audio.load();
        await audio.play();
        hasPlayed.current = true;
      } catch {
        // Likely blocked; wait for user interaction.
      }
    };

    const onUserGesture = async () => {
      if (hasPlayed.current) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.muted = false;
        audio.currentTime = 0;
        await audio.play();
        hasPlayed.current = true;
        cleanup();
      } catch {
        // If still blocked, keep listeners for another try.
      }
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
    document.addEventListener('click', onUserGesture);
    document.addEventListener('keydown', onUserGesture);
    document.addEventListener('touchstart', onUserGesture);
    document.addEventListener('pointermove', onPointerMove, { once: true });

    return cleanup;
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/wanzami-surround.wav"
      preload="auto"
      autoPlay
      aria-hidden="true"
      className="hidden"
    />
  );
}
