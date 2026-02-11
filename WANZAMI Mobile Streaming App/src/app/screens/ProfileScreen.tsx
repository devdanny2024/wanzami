import { motion } from "motion/react";
import { 
  ChevronRight, 
  Crown, 
  Download, 
  Clock, 
  Heart,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

interface ProfileScreenProps {
  onBack?: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const menuItems = [
    {
      icon: Heart,
      label: "My List",
      subtitle: "15 items",
      color: "#FF6A00"
    },
    {
      icon: Clock,
      label: "Watch History",
      subtitle: "Recently watched",
      color: "#A1A1AA"
    },
    {
      icon: Settings,
      label: "Settings",
      subtitle: "App preferences",
      color: "#A1A1AA"
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      subtitle: "FAQs & contact",
      color: "#A1A1AA"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      {/* Header with profile */}
      <div className="bg-gradient-to-b from-[#14141B] to-[#0B0B0F] px-6 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          {/* Profile picture */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#FF6A00]">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* User info */}
          <h1 className="text-white text-2xl font-bold mb-1">Alex Johnson</h1>
          <p className="text-[#A1A1AA] text-sm">alex.johnson@email.com</p>
        </motion.div>
      </div>
      
      {/* Stats */}
      <div className="px-6 mb-8">
        <div className="bg-[#14141B] rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-1">127</div>
              <div className="text-[#A1A1AA] text-xs">Hours Watched</div>
            </div>
            <div className="border-l border-r border-[#1C1C25]">
              <div className="text-2xl font-bold text-white mb-1">43</div>
              <div className="text-[#A1A1AA] text-xs">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">15</div>
              <div className="text-[#A1A1AA] text-xs">My List</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu items */}
      <div className="px-6 space-y-2">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#14141B] hover:bg-[#1C1C25] rounded-xl p-4 flex items-center gap-4 transition-colors group"
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <item.icon className="w-6 h-6" style={{ color: item.color }} />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="text-white font-semibold">{item.label}</h3>
              <p className="text-[#A1A1AA] text-sm">{item.subtitle}</p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-[#A1A1AA] group-hover:text-white transition-colors" />
          </motion.button>
        ))}
        
        {/* Logout button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: menuItems.length * 0.05 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#FF6A00]/10 hover:bg-[#FF6A00]/20 rounded-xl p-4 flex items-center gap-4 transition-colors group mt-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#FF6A00]/20 flex items-center justify-center">
            <LogOut className="w-6 h-6 text-[#FF6A00]" />
          </div>
          
          <div className="flex-1 text-left">
            <h3 className="text-[#FF6A00] font-semibold">Logout</h3>
            <p className="text-[#A1A1AA] text-sm">Sign out of your account</p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-[#FF6A00]" />
        </motion.button>
      </div>
      
      {/* App version */}
      <div className="text-center mt-8 px-6">
        <p className="text-[#6B7280] text-xs">WANZAMI v2.0.1</p>
        <p className="text-[#6B7280] text-xs mt-1">© 2026 Wanzami Entertainment</p>
      </div>
    </div>
  );
}