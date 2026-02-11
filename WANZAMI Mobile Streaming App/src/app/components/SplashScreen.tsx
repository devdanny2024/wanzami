import { motion } from "motion/react";
import { useEffect } from "react";
import logo from "figma:asset/e72a81e634e1779c94b87c6dbc66663c53e48253.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex justify-center mb-8"
        >
          <img src={logo} alt="WANZAMI" className="w-32 h-32 object-contain" />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[#FFB020] text-sm tracking-wider uppercase"
        >
          African Stories, Global Stage
        </motion.p>
        
        {/* Loading indicator */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="mt-8 h-1 bg-gradient-to-r from-[#FF6A00] to-[#FFB020] rounded-full max-w-xs mx-auto"
        />
      </motion.div>
    </motion.div>
  );
}