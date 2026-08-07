import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { navGroups } from '../lib/nav';
import { CsLogo } from './cs/kit';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user?: { name?: string | null; email?: string | null; role?: string | null } | null;
}

/** SUPER_ADMIN reads better as "Super Admin" in a sidebar. */
const roleLabel = (role?: string | null) =>
  role
    ? role
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : null;

export function Sidebar({ currentPage, onNavigate, user }: SidebarProps) {
  const [openCount, setOpenCount] = useState<number>(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navGroups.map((g) => [g.id, Boolean(g.defaultCollapsed)]))
  );

  // Keep a collapsed group open if the active page lives inside it.
  useEffect(() => {
    const owner = navGroups.find((g) => g.items.some((i) => i.id === currentPage));
    if (owner && collapsed[owner.id]) {
      setCollapsed((prev) => ({ ...prev, [owner.id]: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('wanzami-support-open-count');
      if (raw) {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed)) setOpenCount(parsed);
      }
    } catch {
      // ignore
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'wanzami-support-open-count' && e.newValue != null) {
        const parsed = Number(e.newValue);
        if (!Number.isNaN(parsed)) setOpenCount(parsed);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleGroup = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      className="w-64 flex flex-col"
      style={{ background: 'var(--cs-paper)', borderRight: '3px solid var(--cs-ink)' }}
    >
      {/* Wordmark */}
      <div className="p-5" style={{ borderBottom: '3px solid var(--cs-ink)' }}>
        <div className="flex items-center gap-3">
          <CsLogo className="h-9 w-auto shrink-0" />
          <div>
            <h2 className="cs-mono font-bold text-sm" style={{ color: 'var(--cs-ink)', letterSpacing: '0.06em' }}>
              WANZAMI TV
            </h2>
            <p className="cs-slug" style={{ fontSize: 9 }}>Production office</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.id];
          const hasActive = group.items.some((i) => i.id === currentPage);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="cs-mono w-full flex items-center justify-between px-3 mb-1 text-[10px] font-bold uppercase transition-colors"
                style={{ color: hasActive ? 'var(--cs-ink)' : 'var(--cs-muted)', letterSpacing: '0.12em' }}
                aria-expanded={!isCollapsed}
              >
                <span>{group.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`cs-mono w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase transition-colors ${
                          isActive ? '' : 'hover:bg-[var(--cs-panel)]'
                        }`}
                        style={
                          isActive
                            ? { background: 'var(--cs-ink)', color: 'var(--cs-brand)', letterSpacing: '0.07em' }
                            : { color: 'var(--cs-ink)', letterSpacing: '0.07em' }
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 flex items-center justify-between text-left">
                          <span>{item.label}</span>
                          {item.id === 'support' && openCount > 0 && (
                            <span
                              className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: 'var(--cs-brand)', color: 'var(--cs-ink)', border: '1.5px solid var(--cs-ink)' }}
                            >
                              {openCount}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '3px solid var(--cs-ink)' }}>
        <div className="flex items-center gap-3 px-2 py-1">
          <div
            className="w-8 h-8 flex items-center justify-center"
            style={{ background: 'var(--cs-ink)' }}
          >
            <span className="cs-display text-sm" style={{ color: 'var(--cs-brand)' }}>
              {(user?.name || user?.email || '?').trim().charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="cs-mono text-xs font-bold truncate"
              style={{ color: 'var(--cs-ink)' }}
              title={user?.name ?? undefined}
            >
              {user?.name || user?.email || 'Signed in'}
            </p>
            <p className="cs-slug truncate" style={{ fontSize: 9 }} title={user?.email ?? undefined}>
              {user?.email || roleLabel(user?.role) || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
