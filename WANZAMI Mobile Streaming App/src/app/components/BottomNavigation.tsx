import { motion } from "motion/react";
import { Home, Film, Tv, Radio, User } from "lucide-react";

export type TabName = "home" | "movies" | "series" | "live" | "profile";

interface BottomNavigationProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "home" as TabName, label: "Home", icon: Home },
    { id: "movies" as TabName, label: "Movies", icon: Film },
    { id: "series" as TabName, label: "Series", icon: Tv },
    { id: "live" as TabName, label: "Live", icon: Radio },
    { id: "profile" as TabName, label: "Profile", icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#14141B] border-t border-[#1C1C25] z-50">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 py-2 px-4 min-w-[60px] relative"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#FF6A00] rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <Icon 
                className={`w-6 h-6 transition-colors ${
                  isActive ? "text-[#FF6A00]" : "text-[#A1A1AA]"
                }`}
              />
              <span 
                className={`text-xs transition-colors ${
                  isActive ? "text-white font-semibold" : "text-[#A1A1AA]"
                }`}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}