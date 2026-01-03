import { 
  LayoutDashboard, 
  Film, 
  Tv, 
  CreditCard, 
  FileText, 
  Users, 
  Wallet, 
  Shield, 
  BarChart3, 
  Settings,
  ShieldQuestion,
  Bug,
  Mail,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'ppv', label: 'PPV', icon: CreditCard },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'team', label: 'Team', icon: ShieldQuestion },
  { id: 'email', label: 'Email Service', icon: Mail },
  { id: 'payments', label: 'Payments', icon: Wallet },
  { id: 'invoices', label: 'Invoices', icon: CreditCard },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'logs', label: 'Logs', icon: Bug },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#fd7e14] flex items-center justify-center">
            <span className="text-xl text-white">W</span>
          </div>
          <div>
            <h2 className="text-white">Wanzami</h2>
            <p className="text-xs text-neutral-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${isActive 
                  ? 'bg-[#fd7e14]/10 text-[#fd7e14] border-l-2 border-[#fd7e14] shadow-[0_0_20px_rgba(253,126,20,0.15)]' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
            <span className="text-sm text-neutral-400">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white">Admin User</p>
            <p className="text-xs text-neutral-500">admin@wanzami.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
