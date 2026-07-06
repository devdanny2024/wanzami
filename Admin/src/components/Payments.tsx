import { useEffect, useMemo, useState } from 'react';
import { fetchPpvPurchases, type PpvPurchase } from '@/lib/paymentsClient';
import { CsBox, CsPageHeader, CsSlug, CsStat, CsTable, CsTag, type CsColumn } from './cs/kit';

const payTone = (s?: string): { tone: 'good' | 'bad' | 'pending' | 'neutral'; label: string } =>
  s === 'SUCCESS'
    ? { tone: 'good', label: 'Success' }
    : s === 'PENDING'
    ? { tone: 'pending', label: 'Pending' }
    : s === 'FAILED'
    ? { tone: 'bad', label: 'Failed' }
    : { tone: 'neutral', label: s ?? '—' };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const selectStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  padding: '8px 10px',
};

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

  const columns: CsColumn<PpvPurchase>[] = [
    {
      key: 'title',
      header: 'Title',
      cell: (p) => (
        <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>
          {p.title?.name ?? 'Title'}
        </span>
      ),
    },
    {
      key: 'ref',
      header: 'Ref / User',
      cell: (p) => (
        <div>
          <div className="cs-mono text-xs" style={{ color: 'var(--cs-ink)' }}>
            {p.paystackRef ?? p.paystackTrxId ?? p.id}
          </div>
          <div className="cs-mono text-[10px]" style={{ color: 'var(--cs-muted)' }}>
            {p.user?.email ?? p.userId}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (p) => formatCurrency(p.amountNaira ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (p) => {
        const s = payTone(p.status);
        return <CsTag tone={s.tone} label={s.label} />;
      },
    },
    { key: 'gateway', header: 'Gateway', cell: (p) => <span className="cs-mono text-xs">{p.gateway}</span> },
    {
      key: 'date',
      header: 'Date',
      cell: (p) => (
        <span className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>
          {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title={invoicesOnly ? 'The receipts' : 'The ledger'}
        chip={invoicesOnly ? 'Invoices' : 'Payments'}
        slug={
          invoicesOnly
            ? 'Every PPV payment on record'
            : 'Revenue and transaction performance · real transactions only'
        }
        actions={
          <div className="flex items-end gap-3">
            <div>
              <CsSlug className="mb-1">Status</CsSlug>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
                <option value="ALL">All</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <CsSlug className="mb-1">Gateway</CsSlug>
              <select value={gatewayFilter} onChange={(e) => setGatewayFilter(e.target.value)} style={selectStyle}>
                <option value="ALL">All</option>
                <option value="PAYSTACK">Paystack</option>
                <option value="FLUTTERWAVE">Flutterwave</option>
              </select>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CsStat label="Total revenue (NGN)" value={formatCurrency(totals.total)} />
        <CsStat label="Successful transactions" value={String(totals.successCount)} />
        <CsStat label="Failed" value={String(totals.failedCount)} />
      </div>

      <CsBox className="p-5">
        <CsSlug>Transactions</CsSlug>
        <div className="mt-4">
          {error ? (
            <div className="cs-border p-4" style={{ borderColor: 'var(--cs-rust)' }}>
              <p className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-rust)' }}>
                {error}
              </p>
            </div>
          ) : (
            <CsTable
              columns={columns}
              rows={purchases}
              rowKey={(p) => String(p.id)}
              loading={loading}
              emptySlug="No transactions yet"
              emptyBody="Ticket payments land here the moment a purchase goes through."
            />
          )}
        </div>
      </CsBox>
    </div>
  );
}
