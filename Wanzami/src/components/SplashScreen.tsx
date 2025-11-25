import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import wanzamiLogo from '../assets/logo.png';

interface SplashScreenProps {
  onStartRegistration: () => void;
  onLogin: () => void;
}

export function SplashScreen({ onStartRegistration, onLogin }: SplashScreenProps) {
  const [showButtons, setShowButtons] = useState(false);
  const audioPlayedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButtons(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (audioPlayedRef.current) return;
    audioPlayedRef.current = true;
    const audio = new Audio('/Wanzami%20Surround.wav');
    audio.play().catch(() => {
      // Autoplay might be blocked; ignore silently
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0b0c] overflow-hidden">
      {/* Film grain texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      
      {/* Radial gradient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-[#fd7e14]/20 via-transparent to-transparent opacity-40" />
      
      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        {/* Logo with glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 blur-[80px] bg-[#fd7e14]/30 scale-150" />
          
          <Image
            src={wanzamiLogo}
            alt="Wanzami"
            className="relative drop-shadow-2xl"
            width={384}
            height={200}
            priority
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center mb-16"
        >
          <h1 className="text-white text-2xl md:text-3xl lg:text-4xl mb-3 tracking-tight">
            Introducing Wanzami
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            Streaming Made For Us.
          </p>
        </motion.div>

        {/* CTAs */}
        {showButtons && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
          >
            {/* Primary Button */}
            <motion.button
              onClick={onStartRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex-1 px-8 py-4 bg-[#fd7e14] text-white rounded-2xl overflow-hidden transition-all duration-300"
            >
              {/* Animated glow border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#fd7e14] to-[#ff9f4d] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
              
              {/* Pulse animation */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-2xl border-2 border-[#fd7e14]/50"
              />
              
              <span className="relative z-10 tracking-wide">Start Exploring</span>
            </motion.button>

            {/* Secondary Button */}
            <motion.button
              onClick={onStartRegistration}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-8 py-4 bg-white/5 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300"
            >
              <span className="tracking-wide">Browse Library</span>
            </motion.button>

            {/* Login */}
            <motion.button
              onClick={onLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-8 py-4 bg-white/5 backdrop-blur-md text-white rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300"
            >
              <span className="tracking-wide">Login</span>
            </motion.button>
          </motion.div>
        )}

        {/* Scroll indicator */}
        {showButtons && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2"
            >
              <div className="w-1.5 h-1.5 bg-[#fd7e14] rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
