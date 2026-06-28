import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Eye, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable, type Column, type BulkAction } from './DataTable';
import { StatusBadge } from './StatusBadge';
import type { StatusTone } from '../lib/status';

const userStatusTone = (s?: string | null): { tone: StatusTone; label: string } => {
  if (s === 'Inactive') return { tone: 'error', label: 'Inactive' };
  if (s === 'Unverified') return { tone: 'pending', label: 'Unverified' };
  return { tone: 'live', label: s ?? 'Active' };
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

  const columns: Column<UserRow>[] = [
    { key: 'name', header: 'User', cell: (u) => <span className="text-white">{u.name || '—'}</span>, sortValue: (u) => (u.name ?? '').toLowerCase() },
    { key: 'email', header: 'Email', cell: (u) => u.email, sortValue: (u) => u.email.toLowerCase() },
    { key: 'createdAt', header: 'Join Date', cell: (u) => new Date(u.createdAt).toLocaleDateString(), sortValue: (u) => new Date(u.createdAt).getTime() },
    { key: 'profileCount', header: 'Profiles', cell: (u) => u.profileCount ?? '—', sortValue: (u) => u.profileCount ?? 0, align: 'right' },
    { key: 'totalWatchTime', header: 'Watch Time', cell: (u) => u.totalWatchTime ?? '—' },
    { key: 'ppvPurchases', header: 'PPV', cell: (u) => u.ppvPurchases ?? '—', sortValue: (u) => u.ppvPurchases ?? 0, align: 'right' },
    {
      key: 'totalSpent',
      header: 'Total Spent (NGN)',
      cell: (u) => (u.totalSpent != null ? `₦${u.totalSpent.toLocaleString()}` : '—'),
      sortValue: (u) => u.totalSpent ?? 0,
      align: 'right',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => {
        const s = userStatusTone(u.status);
        return <StatusBadge tone={s.tone} label={s.label} />;
      },
      sortValue: (u) => u.status ?? 'Active',
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (u) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10"
              onClick={() => setSelectedUser(u)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-white">User Profile</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <UserProfileModal user={selectedUser} onDelete={handleDelete} deletingId={deletingId} />
            )}
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  const bulkActions: BulkAction<UserRow>[] = [
    {
      label: 'Copy emails',
      icon: Copy,
      onClick: (rows) => {
        const emails = rows.map((r) => r.email).join(', ');
        void navigator.clipboard?.writeText(emails);
        toast.success(`Copied ${rows.length} email${rows.length === 1 ? '' : 's'}`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">User Management</h1>
        <p className="text-neutral-400 mt-1">Manage registered users</p>
      </div>

      {/* Search + Filters */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                type="search"
                placeholder="Search users by name or email..."
                className="pl-10 bg-neutral-950 border-neutral-800 text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(u) => u.id}
            loading={loading}
            emptyMessage="No users found"
            bulkActions={bulkActions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function UserProfileModal({
  user,
  onDelete,
  deletingId,
}: {
  user: UserRow;
  onDelete: (u: UserRow) => void;
  deletingId: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="flex items-start gap-4 pb-4 border-b border-neutral-800">
        <div className="flex-1">
          <h3 className="text-xl text-white">{user.name}</h3>
          <p className="text-neutral-400">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-neutral-800 text-neutral-300">
              {user.role}
            </Badge>
            <Badge className={user.status === 'Suspended' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
              {user.status ?? 'Active'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-neutral-950 border-neutral-800">
          <CardContent className="pt-4">
            <p className="text-sm text-neutral-400">Member Since</p>
            <p className="text-white mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-950 border-neutral-800">
          <CardContent className="pt-4">
            <p className="text-sm text-neutral-400">Last Login</p>
            <p className="text-white mt-1">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-950 border-neutral-800">
          <CardContent className="pt-4">
            <p className="text-sm text-neutral-400">Role</p>
            <p className="text-white mt-1">{user.role}</p>
          </CardContent>
        </Card>
        <Card className="bg-neutral-950 border-neutral-800">
          <CardContent className="pt-4">
            <p className="text-sm text-neutral-400">Status</p>
            <p className="text-white mt-1">{user.status ?? 'Active'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => onDelete(user)}
          disabled={deletingId === user.id}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="w-4 h-4" />
          {deletingId === user.id ? 'Deleting...' : 'Delete User'}
        </Button>
      </div>
    </div>
  );
}
