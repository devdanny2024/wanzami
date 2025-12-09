import { useEffect, useState } from "react";

type TopLoaderProps = {
  active: boolean;
};

export function TopLoader({ active }: TopLoaderProps) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
    } else {
      // Small delay to allow the bar to finish its animation smoothly
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <>
      <div className="fixed top-0 left-0 w-full h-[4px] z-[2147483647] overflow-hidden pointer-events-none bg-transparent">
        <div className="h-full top-loader-bar" />
      </div>
      <style>{`
        .top-loader-bar {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #ff8a1f, #ffb366, #ff8a1f);
          background-size: 200% 100%;
          animation: top-loader-indeterminate 1.4s ease-in-out infinite;
          box-shadow: 0 1px 4px rgba(255, 138, 31, 0.35);
        }
        @keyframes top-loader-indeterminate {
          0% { transform: translateX(-30%) scaleX(0.3); background-position: 0% 50%; }
          25% { transform: translateX(10%) scaleX(0.6); background-position: 50% 50%; }
          50% { transform: translateX(40%) scaleX(0.8); background-position: 100% 50%; }
          75% { transform: translateX(60%) scaleX(0.6); background-position: 50% 50%; }
          100% { transform: translateX(100%) scaleX(0.3); background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}
