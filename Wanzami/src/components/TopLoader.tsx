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
      <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] overflow-hidden pointer-events-none">
        <div className="h-full w-full top-loader-bar" />
      </div>
      <style>{`
        .top-loader-bar {
          background: linear-gradient(90deg, #fd7e14, #ffb347, #fd7e14);
          background-size: 200% 100%;
          animation: top-loader-slide 1s linear infinite;
        }
        @keyframes top-loader-slide {
          0% { transform: translateX(-50%); background-position: 0% 50%; }
          50% { transform: translateX(0%); background-position: 50% 50%; }
          100% { transform: translateX(50%); background-position: 100% 50%; }
        }
      `}</style>
    </>
  );
}
