import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTable, CsTag, type CsColumn } from './cs/kit';

const userStatusTone = (s?: string | null): { tone: 'good' | 'bad' | 'pending'; label: string } => {
  if (s === 'Inactive') return { tone: 'bad', label: 'Inactive' };
  if (s === 'Unverified') return { tone: 'pending', label: 'Unverified' };
  return { tone: 'good', label: s ?? 'Active' };
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalWatchTime?: string | null;
  ppvPurchases?: number | null;
  totalSpent?: number | null;
  status?: string | null;
  lastLogin?: string | null;
  profileCount?: number | null;
};

const fieldStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
  width: '100%',
};

export function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive' | 'Unverified'>('all');

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/users/all', { headers: { ...authHeaders() } });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message ?? 'Unable to load users');
          return;
        }
        setUsers(data.users ?? []);
      } catch (err) {
        toast.error('Unable to load users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (user: UserRow) => {
    if (!window.confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.message ?? 'Failed to delete user');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSelectedUser(null);
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users
      .filter((u) => u.role === 'USER')
      .filter(
        (u) => u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q)
      )
      .filter((u) => {
        if (statusFilter === 'all') return true;
        return (u.status ?? 'Active') === statusFilter;
      });
  }, [query, users, statusFilter]);

  const columns: CsColumn<UserRow>[] = [
    {
      key: 'name',
      header: 'User',
      cell: (u) => (
        <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>
          {u.name || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => <span className="cs-mono text-xs">{u.email}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      cell: (u) => (
        <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    { key: 'profileCount', header: 'Profiles', align: 'right', cell: (u) => u.profileCount ?? '—' },
    { key: 'ppvPurchases', header: 'Tickets', align: 'right', cell: (u) => u.ppvPurchases ?? '—' },
    {
      key: 'totalSpent',
      header: 'Spent (NGN)',
      align: 'right',
      cell: (u) => (u.totalSpent != null ? `₦${u.totalSpent.toLocaleString()}` : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => {
        const s = userStatusTone(u.status);
        return <CsTag tone={s.tone} label={s.label} />;
      },
    },
    {
      key: 'actions',
      header: 'File',
      cell: (u) => (
        <button
          onClick={() => setSelectedUser(u)}
          className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)]"
          style={{ border: '2px solid var(--cs-ink)', color: 'var(--cs-ink)', letterSpacing: '0.08em' }}
        >
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The crew list"
        chip={loading ? '···' : `${filtered.length} viewers`}
        slug="Registered users · community"
      />

      {/* Search + Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--cs-muted)' }}
          />
          <input
            type="search"
            placeholder="SEARCH THE INDEX… NAME OR EMAIL"
            style={{ ...fieldStyle, paddingLeft: 38 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ ...fieldStyle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Unverified">Unverified</option>
        </select>
      </div>

      {/* Users Table */}
      <CsBox className="p-5">
        <CsSlug>All users</CsSlug>
        <div className="mt-4">
          <CsTable
            columns={columns}
            rows={filtered}
            rowKey={(u) => u.id}
            loading={loading}
            emptySlug="No users found"
            emptyBody="Nobody matches this search. Clear the filters to see the whole crew."
          />
        </div>
      </CsBox>

      {/* User file drawer */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(22, 19, 16, 0.55)' }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="cs-border cs-shadow w-full max-w-xl p-6"
            style={{ background: 'var(--cs-paper)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4" style={{ borderBottom: '2.5px solid var(--cs-ink)' }}>
              <div>
                <CsSlug>Crew file</CsSlug>
                <h3 className="cs-display mt-1" style={{ fontSize: 30, color: 'var(--cs-ink)' }}>
                  {selectedUser.name || 'Unnamed viewer'}
                </h3>
                <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>{selectedUser.email}</p>
                <div className="flex gap-2 mt-2">
                  <CsTag label={selectedUser.role} tone="neutral" />
                  <CsTag {...(() => { const s = userStatusTone(selectedUser.status); return { label: s.label, tone: s.tone }; })()} />
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="cs-mono text-xs font-bold px-2 py-1"
                style={{ border: '2px solid var(--cs-ink)' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { label: 'Member since', value: new Date(selectedUser.createdAt).toLocaleDateString() },
                {
                  label: 'Last login',
                  value: selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : '—',
                },
                { label: 'Profiles', value: String(selectedUser.profileCount ?? '—') },
                {
                  label: 'Total spent',
                  value: selectedUser.totalSpent != null ? `₦${selectedUser.totalSpent.toLocaleString()}` : '—',
                },
              ].map((f) => (
                <div key={f.label} className="p-3" style={{ border: '1.5px solid var(--cs-line)' }}>
                  <CsSlug>{f.label}</CsSlug>
                  <p className="cs-mono text-sm font-bold mt-1" style={{ color: 'var(--cs-ink)' }}>{f.value}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-5">
              <CsButton
                variant="rust"
                onClick={() => handleDelete(selectedUser)}
                disabled={deletingId === selectedUser.id}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === selectedUser.id ? 'Deleting…' : 'Delete user'}
                </span>
              </CsButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
