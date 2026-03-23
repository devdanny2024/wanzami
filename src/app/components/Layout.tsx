import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Film, Tv, Radio, Search, User, Settings } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { useFocus } from "../context/FocusContext";
import { useEffect, useState } from "react";
import { FocusableButton } from "./FocusableButton";
import { DeviceIndicator } from "./DeviceIndicator";

const navItems = [
  { id: "nav-home", path: "/", label: "Home", icon: Home },
  { id: "nav-movies", path: "/movies", label: "Movies", icon: Film },
  { id: "nav-series", path: "/series", label: "Series", icon: Tv },
  { id: "nav-live", path: "/live", label: "Live", icon: Radio },
  { id: "nav-search", path: "/search", label: "Search", icon: Search },
];

const accountItems = [
  { id: "nav-profile", path: "/profile", label: "Profile", icon: User },
  { id: "nav-settings", path: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTv, isTablet, isPortrait } = useDevice();
  const { setFocusedId } = useFocus();
  const [showNav, setShowNav] = useState(true);

  // Hide nav on player pages
  useEffect(() => {
    const isPlayerPage = location.pathname.includes("/watch") || location.pathname.includes("/live/");
    setShowNav(!isPlayerPage);
  }, [location.pathname]);

  if (!showNav) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <nav
        className={`
          bg-[#0F0F14] border-r border-white/5 flex-shrink-0
          ${isTv ? "w-[280px]" : isPortrait ? "w-[80px]" : "w-[240px]"}
        `}
      >
        {/* Logo */}
        <div className={`px-6 py-8 ${isPortrait ? "px-4" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E63946] to-[#F4A261] flex items-center justify-center">
              <span className="text-white font-bold text-xl">W</span>
            </div>
            {!isPortrait && (
              <span className="text-white text-2xl font-bold tracking-tight">Wanzami</span>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <FocusableButton
                key={item.id}
                id={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                  ${isPortrait ? "justify-center px-2" : ""}
                `}
              >
                <Icon className={`${isTv ? "w-7 h-7" : "w-6 h-6"} flex-shrink-0`} />
                {!isPortrait && <span>{item.label}</span>}
              </FocusableButton>
            );
          })}
        </div>

        {/* Account Section */}
        <div className="px-3 mt-8 space-y-1">
          {accountItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <FocusableButton
                key={item.id}
                id={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-4 px-4 py-3.5 rounded-lg
                  transition-all duration-200
                  ${isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                  ${isPortrait ? "justify-center px-2" : ""}
                `}
              >
                <Icon className={`${isTv ? "w-7 h-7" : "w-6 h-6"} flex-shrink-0`} />
                {!isPortrait && <span>{item.label}</span>}
              </FocusableButton>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0A0A0F]">
        <Outlet />
      </main>
      
      {/* Device Indicator */}
      <DeviceIndicator />
    </div>
  );
}