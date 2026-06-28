import { Bell, Search, Power } from 'lucide-react';
import { findNav } from '../lib/nav';

interface HeaderProps {
  currentPage: string;
  onOpenSearch: () => void;
  onLogout?: () => void;
}

export function Header({ currentPage, onOpenSearch, onLogout }: HeaderProps) {
  const match = findNav(currentPage);

  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm px-8 flex items-center justify-between">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
        {match ? (
          <>
            <span className="text-neutral-500 truncate">{match.group.label}</span>
            <span className="text-neutral-600">/</span>
            <span className="text-white font-medium truncate">{match.item.label}</span>
          </>
        ) : (
          <span className="text-white font-medium">Wanzami</span>
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 transition-colors"
          aria-label="Search and jump to screen"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search…</span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-neutral-700 bg-neutral-800 px-1.5 text-[10px] text-neutral-400">
            ⌘K
          </kbd>
        </button>
        <button className="relative p-2 rounded-lg hover:bg-neutral-800 transition-colors" aria-label="Notifications">
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
