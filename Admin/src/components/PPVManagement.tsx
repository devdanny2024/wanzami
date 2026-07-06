import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authClient';
import { fetchPpvPurchases, type PpvPurchase } from '@/lib/paymentsClient';
import { CsBox, CsEmpty, CsPageHeader, CsSlug, CsStat, CsTable, CsTag, type CsColumn } from './cs/kit';

type TitleRow = {
  id: number | string;
  name: string;
  type?: string;
  isPpv?: boolean;
  ppvPriceNaira?: number | null;
};

type PpvTitleRow = TitleRow & {
  purchases: number;
  revenue: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

export function PPVManagement() {
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [purchases, setPurchases] = useState<PpvPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      try {
        const [titlesRes, purchasesRes] = await Promise.allSettled([
          authFetch('/admin/titles', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetchPpvPurchases(token),
        ]);

        if (titlesRes.status === 'fulfilled' && titlesRes.value.ok) {
          setTitles(((titlesRes.value.data as any)?.titles ?? []) as TitleRow[]);
        } else {
          toast.error('Failed to load titles');
        }
        if (purchasesRes.status === 'fulfilled') {
          setPurchases(purchasesRes.value.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const ppvTitles: PpvTitleRow[] = useMemo(() => {
    const byTitle = new Map<string, { purchases: number; revenue: number }>();
    for (const p of purchases) {
      if (p.status !== 'SUCCESS') continue;
      const key = String(p.titleId ?? p.title?.id ?? '');
      const entry = byTitle.get(key) ?? { purchases: 0, revenue: 0 };
      entry.purchases += 1;
      entry.revenue += p.amountNaira ?? 0;
      byTitle.set(key, entry);
    }
    return titles
      .filter((t) => t.isPpv)
      .map((t) => ({
        ...t,
        purchases: byTitle.get(String(t.id))?.purchases ?? 0,
        revenue: byTitle.get(String(t.id))?.revenue ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [titles, purchases]);

  const stats = useMemo(() => {
    const success = purchases.filter((p) => p.status === 'SUCCESS');
    const revenue = success.reduce((sum, p) => sum + (p.amountNaira ?? 0), 0);
    const avg = success.length > 0 ? Math.round(revenue / success.length) : 0;
    return {
      revenue,
      ticketCount: success.length,
      enabledCount: ppvTitles.length,
      avg,
    };
  }, [purchases, ppvTitles]);

  const columns: CsColumn<PpvTitleRow>[] = [
    {
      key: 'name',
      header: 'Title',
      cell: (t) => (
        <span className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-ink)' }}>
          {t.name}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Ticket price',
      align: 'right',
      cell: (t) => (t.ppvPriceNaira != null ? formatCurrency(t.ppvPriceNaira) : '—'),
    },
    {
      key: 'purchases',
      header: 'Tickets sold',
      align: 'right',
      cell: (t) => t.purchases,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      cell: (t) => formatCurrency(t.revenue),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) =>
        t.purchases > 0 ? <CsTag label="Selling" tone="good" /> : <CsTag label="No sales yet" tone="pending" />,
    },
  ];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The box office"
        chip={`${stats.enabledCount} on sale`}
        slug="Pay-per-view · tickets, prices, takings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28"
              style={{ background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }}
            />
          ))
        ) : (
          <>
            <CsStat label="Total takings · all time" value={formatCurrency(stats.revenue)} />
            <CsStat label="Tickets sold" value={String(stats.ticketCount)} />
            <CsStat label="Titles on sale" value={String(stats.enabledCount)} />
            <CsStat
              label="Average ticket"
              value={stats.ticketCount > 0 ? formatCurrency(stats.avg) : '—'}
            />
          </>
        )}
      </div>

      <CsBox className="p-5">
        <div className="flex items-center justify-between">
          <CsSlug>PPV-enabled titles · live pricing from the catalogue</CsSlug>
        </div>
        <div className="mt-4">
          <CsTable
            columns={columns}
            rows={ppvTitles}
            rowKey={(t) => String(t.id)}
            loading={loading}
            emptySlug="Nothing on sale"
            emptyBody="No titles have PPV enabled. Turn PPV on for a title in Movies or Series to sell tickets."
          />
        </div>
      </CsBox>

      {!loading && ppvTitles.length > 0 && stats.ticketCount === 0 && (
        <CsEmpty
          slug="Honest ledger"
          body="Titles are on sale but no tickets have been sold yet. Numbers on this page only ever come from real purchases."
        />
      )}

      <CsSlug>
        Pricing is edited on each title in Movies / Series. This page reads real purchases only.
      </CsSlug>
    </div>
  );
}
