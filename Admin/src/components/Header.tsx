import { Bell, Search, Power } from 'lucide-react';
import { Input } from './ui/input';

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm px-8 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-[#fd7e14]"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-neutral-800 transition-colors">
          <Bell className="w-5 h-5 text-neutral-400" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#fd7e14] rounded-full"></span>
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700"
            aria-label="Logout"
          >
            <Power className="w-5 h-5 text-red-400" />
          </button>
        )}
      </div>
    </header>
  );
}
