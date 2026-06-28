import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { navGroups } from '../lib/nav';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
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
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => {
          const isCollapsed = collapsed[group.id];
          const hasActive = group.items.some((i) => i.id === currentPage);
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-expanded={!isCollapsed}
              >
                <span className={hasActive ? 'text-neutral-300' : ''}>{group.label}</span>
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
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                          ${isActive
                            ? 'bg-[#fd7e14]/10 text-[#fd7e14] border-l-2 border-[#fd7e14] shadow-[0_0_20px_rgba(253,126,20,0.15)]'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 flex items-center justify-between text-sm">
                          <span>{item.label}</span>
                          {item.id === 'support' && openCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-[#fd7e14] text-[10px] px-2 py-0.5 text-white">
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
