import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import { fetchPpvPurchases, type PpvPurchase } from '@/lib/paymentsClient';

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
        <CardContent className="space-y-3">
          {loading && <p className="text-neutral-400 text-sm">Loading...</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {!loading && !error && purchases.length === 0 && (
            <p className="text-neutral-500 text-sm">No transactions found.</p>
          )}
          {!loading &&
            !error &&
            purchases.map((p) => (
              <div
                key={p.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-neutral-950 border border-neutral-800 rounded-lg p-3 gap-2"
              >
                <div>
                  <p className="text-white font-medium">{p.title?.name ?? 'Title'}</p>
                  <p className="text-xs text-neutral-400">
                    Ref: {p.paystackRef ?? p.paystackTrxId ?? p.id} · {p.user?.email ?? p.userId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white">
                    ₦{(p.amountNaira ?? 0).toLocaleString()} {p.currency ?? ''}
                  </p>
                  <p
                    className={`text-xs ${
                      p.status === 'SUCCESS'
                        ? 'text-emerald-400'
                        : p.status === 'PENDING'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {p.status} · {p.gateway}
                  </p>
                  {p.createdAt ? (
                    <p className="text-[11px] text-neutral-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
                <Badge
                  className={
                    p.gateway === 'PAYSTACK'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }
                >
                  {p.gateway}
                </Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}

