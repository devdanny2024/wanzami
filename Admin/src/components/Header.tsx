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
    <header
      className="h-14 px-6 flex items-center justify-between"
      style={{ background: 'var(--cs-paper)', borderBottom: '3px solid var(--cs-ink)' }}
    >
      {/* Breadcrumb as a scene slug */}
      <nav aria-label="Breadcrumb" className="cs-mono flex items-center gap-2 min-w-0 text-xs font-bold uppercase">
        {match ? (
          <>
            <span style={{ color: 'var(--cs-muted)', letterSpacing: '0.09em' }} className="truncate">
              {match.group.label}
            </span>
            <span style={{ color: 'var(--cs-muted)' }}>/</span>
            <span style={{ color: 'var(--cs-ink)', letterSpacing: '0.09em' }} className="truncate">
              {match.item.label}
            </span>
          </>
        ) : (
          <span style={{ color: 'var(--cs-ink)' }}>Wanzami</span>
        )}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSearch}
          className="cs-mono flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase transition-colors hover:bg-[var(--cs-panel)]"
          style={{ border: '2px solid var(--cs-ink)', color: 'var(--cs-muted)', letterSpacing: '0.08em' }}
          aria-label="Search and jump to screen"
        >
          <Search className="w-3.5 h-3.5" style={{ color: 'var(--cs-ink)' }} />
          <span className="hidden sm:inline">Search the index…</span>
          <kbd
            className="hidden sm:inline-flex items-center px-1.5 text-[9px] font-bold"
            style={{ border: '1.5px solid var(--cs-line)', color: 'var(--cs-muted)' }}
          >
            ⌘K
          </kbd>
        </button>
        <button
          className="relative p-2 transition-colors hover:bg-[var(--cs-panel)]"
          style={{ border: '2px solid var(--cs-ink)' }}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" style={{ color: 'var(--cs-ink)' }} />
          <span
            className="absolute -top-1.5 -right-1.5 w-3 h-3"
            style={{ background: 'var(--cs-brand)', border: '1.5px solid var(--cs-ink)' }}
          ></span>
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 transition-colors hover:bg-[var(--cs-panel)]"
            style={{ border: '2px solid var(--cs-rust)' }}
            aria-label="Logout"
          >
            <Power className="w-4 h-4" style={{ color: 'var(--cs-rust)' }} />
          </button>
        )}
      </div>
    </header>
  );
}
