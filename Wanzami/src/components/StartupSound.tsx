'use client';

import { useEffect, useRef } from 'react';

/**
 * Plays a short Wanzami brand sound on app load with a graceful fallback:
 * - Attempts autoplay on mount.
 * - If blocked by the browser, waits for the first user interaction to play once.
 */
type StartupSoundProps = {
  onReady?: () => void;
};

export function StartupSound({ onReady }: StartupSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const attemptedAuto = useRef(false);
  const playedAudible = useRef(false);
  const readyCalled = useRef(false);

  const signalReady = () => {
    if (readyCalled.current) return;
    readyCalled.current = true;
    onReady?.();
  };

  useEffect(() => {
    const playSound = async () => {
      // Try a muted autoplay to warm up; don't mark as played yet.
      if (attemptedAuto.current) return;
      attemptedAuto.current = true;
      try {
        const audio = audioRef.current;
        if (!audio) return;

        // Allow autoplay by starting muted; we'll unmute on gesture.
        audio.muted = true;
        audio.volume = 0.6;
        audio.load();
        await audio.play();
        // Autoplay may stay muted; don't mark as fully played yet.
      } catch {
        // Likely blocked; wait for user interaction.
      }
    };

    const onUserGesture = async () => {
      if (playedAudible.current) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.muted = false;
        audio.currentTime = 0;
        await audio.play();
        playedAudible.current = true;
        cleanup();
        signalReady();
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

    // Safety timeout: don't block UI if audio never plays
    const fallback = window.setTimeout(() => signalReady(), 5000);

    return () => {
      cleanup();
      window.clearTimeout(fallback);
    };
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
