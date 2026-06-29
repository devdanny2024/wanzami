import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { fetchPpvPurchases, type PpvPurchase } from '@/lib/paymentsClient';
import { DataTable, type Column } from './DataTable';
import { StatusBadge } from './StatusBadge';
import type { StatusTone } from '../lib/status';

const payTone = (s?: string): { tone: StatusTone; label: string } =>
  s === 'SUCCESS'
    ? { tone: 'live', label: 'Success' }
    : s === 'PENDING'
    ? { tone: 'pending', label: 'Pending' }
    : s === 'FAILED'
    ? { tone: 'error', label: 'Failed' }
    : { tone: 'neutral', label: s ?? '—' };

export function Payments({ invoicesOnly = false }: { invoicesOnly?: boolean }) {
  const [purchases, setPurchases] = useState<PpvPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [gatewayFilter, setGatewayFilter] = useState<string>('ALL');

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null), []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPpvPurchases(token, {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          gateway: gatewayFilter !== 'ALL' ? gatewayFilter : undefined,
        });
        setPurchases(data.items ?? []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, statusFilter, gatewayFilter]);

  const totals = useMemo(() => {
    const success = purchases.filter((p) => p.status === 'SUCCESS');
    const total = success.reduce((sum, p) => sum + (p.amountNaira ?? 0), 0);
    const failed = purchases.filter((p) => p.status === 'FAILED').length;
    return { total, successCount: success.length, failedCount: failed };
  }, [purchases]);

  const columns: Column<PpvPurchase>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (p) => <span className="text-white">{p.title?.name ?? 'Title'}</span>,
      sortValue: (p) => (p.title?.name ?? '').toLowerCase(),
    },
    {
      key: 'ref',
      header: 'Ref / User',
      cell: (p) => (
        <div>
          <div className="text-neutral-300">{p.paystackRef ?? p.paystackTrxId ?? p.id}</div>
          <div className="text-xs text-neutral-500">{p.user?.email ?? p.userId}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (NGN)',
      align: 'right',
      cell: (p) => `₦${(p.amountNaira ?? 0).toLocaleString()}`,
      sortValue: (p) => p.amountNaira ?? 0,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => {
        const s = payTone(p.status);
        return <StatusBadge tone={s.tone} label={s.label} />;
      },
      sortValue: (p) => p.status ?? '',
    },
    { key: 'gateway', header: 'Gateway', cell: (p) => p.gateway, sortValue: (p) => p.gateway ?? '' },
    {
      key: 'date',
      header: 'Date',
      cell: (p) => (p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'),
      sortValue: (p) => (p.createdAt ? new Date(p.createdAt).getTime() : 0),
    },
  ];

  const displayTitle = invoicesOnly ? 'Invoices' : 'Payments';
  const displaySubtitle = invoicesOnly
    ? 'All PPV payments and totals'
    : 'Track revenue and transaction performance';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl text-white">{displayTitle}</h1>
          <p className="text-neutral-400 mt-1">{displaySubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <Label className="text-neutral-400 text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-neutral-400 text-xs">Gateway</Label>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger className="w-36 bg-neutral-900 border-neutral-800 text-white">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PAYSTACK">Paystack</SelectItem>
                <SelectItem value="FLUTTERWAVE">Flutterwave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white">Total Revenue (NGN)</CardTitle>
            <DollarSign className="w-5 h-5 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              ₦{totals.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white">Successful Transactions</CardTitle>
            <CreditCard className="w-5 h-5 text-[#fd7e14]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totals.successCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white">Failed</CardTitle>
            <AlertCircle className="w-5 h-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totals.failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <DataTable
              columns={columns}
              rows={purchases}
              rowKey={(p) => String(p.id)}
              loading={loading}
              emptyMessage="No transactions found."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

