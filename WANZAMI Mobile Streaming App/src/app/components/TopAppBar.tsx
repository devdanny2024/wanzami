import { Search, Bell } from "lucide-react";
import { motion } from "motion/react";

interface TopAppBarProps {
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  showLogo?: boolean;
}

export function TopAppBar({ 
  onSearchClick, 
  onNotificationsClick, 
  onProfileClick,
  showLogo = true 
}: TopAppBarProps) {
  return (
    <div className="sticky top-0 left-0 right-0 bg-gradient-to-b from-[#0B0B0F] to-transparent z-40 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="text-2xl font-bold">
              <span className="text-[#FF6A00]">WAN</span>
              <span className="text-white">ZAMI</span>
            </div>
          </motion.div>
        )}
        
        {/* Right actions */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onSearchClick}
            className="w-10 h-10 rounded-full bg-[#14141B] flex items-center justify-center hover:bg-[#1C1C25] transition-colors"
          >
            <Search className="w-5 h-5 text-white" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onNotificationsClick}
            className="w-10 h-10 rounded-full bg-[#14141B] flex items-center justify-center hover:bg-[#1C1C25] transition-colors relative"
          >
            <Bell className="w-5 h-5 text-white" />
            {/* Notification dot */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6A00] rounded-full" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#FF6A00]"
          >
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}