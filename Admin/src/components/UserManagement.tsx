import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

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
};

export function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400">User</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Email</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Join Date</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Watch Time</th>
                  <th className="text-left py-3 px-4 text-neutral-400">PPV Purchases</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Total Spent (NGN)</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Status</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4 text-white">{user.name || '—'}</td>
                    <td className="py-3 px-4 text-neutral-300">{user.email}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {user.totalWatchTime ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {user.ppvPurchases ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">
                      {user.totalSpent != null ? `₦${user.totalSpent.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={user.status === 'Inactive' ? 'bg-red-500/20 text-red-400' : user.status === 'Unverified' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                        {user.status ?? 'Active'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">User Profile</DialogTitle>
                          </DialogHeader>
                          {selectedUser && <UserProfileModal user={selectedUser} />}
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-400">
                      No users found
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-neutral-400">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UserProfileModal({ user }: { user: UserRow }) {
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
    </div>
  );
}
