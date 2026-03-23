import React, { createContext, useContext, useEffect, useState } from "react";

type DeviceType = "tv" | "tablet-landscape" | "tablet-portrait";

interface DeviceContextType {
  deviceType: DeviceType;
  isTv: boolean;
  isTablet: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // TV: 1920×1080
    if (width >= 1800) return "tv";
    
    // Tablet landscape: 1366×1024
    if (width >= 1200 && width > height) return "tablet-landscape";
    
    // Tablet portrait: 1024×1366
    return "tablet-portrait";
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      if (width >= 1800) {
        setDeviceType("tv");
      } else if (width >= 1200 && width > height) {
        setDeviceType("tablet-landscape");
      } else {
        setDeviceType("tablet-portrait");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTv = deviceType === "tv";
  const isTablet = deviceType.startsWith("tablet");
  const isPortrait = deviceType === "tablet-portrait";
  const isLandscape = deviceType === "tablet-landscape" || deviceType === "tv";

  return (
    <DeviceContext.Provider
      value={{ deviceType, isTv, isTablet, isPortrait, isLandscape }}
    >
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within DeviceProvider");
  }
  return context;
}
