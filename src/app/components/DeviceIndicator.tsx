import { Monitor, Tablet } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { useState } from "react";

export function DeviceIndicator() {
  const { deviceType, isTv } = useDevice();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[#0F0F14]/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        {isTv ? (
          <Monitor className="w-5 h-5 text-[#E63946]" />
        ) : (
          <Tablet className="w-5 h-5 text-[#F4A261]" />
        )}
        <div>
          <p className="text-white text-sm font-semibold">
            {deviceType === "tv" && "TV Mode"}
            {deviceType === "tablet-landscape" && "Tablet Landscape"}
            {deviceType === "tablet-portrait" && "Tablet Portrait"}
          </p>
          <p className="text-white/50 text-xs">
            {isTv && "Use arrow keys + Enter"}
            {!isTv && "Touch optimized"}
          </p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-2 text-white/40 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
