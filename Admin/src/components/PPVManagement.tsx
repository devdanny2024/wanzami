import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authClient';
import { fetchPpvPurchases, type PpvPurchase } from '@/lib/paymentsClient';
import { CsBox, CsButton, CsEmpty, CsPageHeader, CsSlug, CsStat, CsTable, CsTag, type CsColumn } from './cs/kit';

const fieldStyle: React.CSSProperties = {
  border: '2px solid var(--cs-ink)',
  background: 'var(--cs-paper)',
  color: 'var(--cs-ink)',
  fontFamily: 'var(--font-smono), monospace',
  fontSize: 12,
  padding: '9px 12px',
};

type FxOverride = { currency: string; rate: number; updatedAt: string };

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

  const [fxOverrides, setFxOverrides] = useState<FxOverride[]>([]);
  const [fxLiveRates, setFxLiveRates] = useState<Record<string, number>>({});
  const [fxLoading, setFxLoading] = useState(true);
  const [fxCurrency, setFxCurrency] = useState('');
  const [fxNairaPerUnit, setFxNairaPerUnit] = useState('');
  const [fxSaving, setFxSaving] = useState(false);

  const authHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadFxRates = async () => {
    setFxLoading(true);
    try {
      const res = await authFetch('/admin/ppv/fx-rates', { headers: authHeaders() });
      if (res.ok) {
        const data = res.data as { overrides?: FxOverride[]; liveRates?: Record<string, number> };
        setFxOverrides(data.overrides ?? []);
        setFxLiveRates(data.liveRates ?? {});
      } else {
        toast.error('Failed to load FX rates');
      }
    } finally {
      setFxLoading(false);
    }
  };

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
    void loadFxRates();
  }, []);

  const saveFxRate = async () => {
    const currency = fxCurrency.trim().toUpperCase();
    const nairaPerUnit = Number(fxNairaPerUnit);
    if (!/^[A-Z]{3}$/.test(currency)) {
      toast.error('Currency must be a 3-letter code, e.g. USD');
      return;
    }
    if (!Number.isFinite(nairaPerUnit) || nairaPerUnit <= 0) {
      toast.error('Enter how many naira 1 unit of that currency is worth');
      return;
    }
    setFxSaving(true);
    try {
      const res = await authFetch('/admin/ppv/fx-rates', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ currency, rate: 1 / nairaPerUnit }),
      });
      if (!res.ok) {
        toast.error((res.data as any)?.message ?? 'Failed to save rate');
        return;
      }
      toast.success(`${currency} rate saved`);
      setFxCurrency('');
      setFxNairaPerUnit('');
      await loadFxRates();
    } finally {
      setFxSaving(false);
    }
  };

  const removeFxRate = async (currency: string) => {
    const res = await authFetch(`/admin/ppv/fx-rates/${currency}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      toast.error('Failed to remove override');
      return;
    }
    toast.success(`${currency} back to the live rate`);
    await loadFxRates();
  };

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

      <CsBox className="p-5">
        <div className="flex items-center justify-between">
          <CsSlug>FX rates · what buyers outside Nigeria are charged</CsSlug>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--cs-muted)' }}>
          Prices are set in naira. When a rate is set here it replaces the live exchange rate for
          that currency. Remove it to go back to the live rate.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <CsSlug className="mb-2">Currency</CsSlug>
            <input
              value={fxCurrency}
              onChange={(e) => setFxCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
              maxLength={3}
              style={{ ...fieldStyle, width: 90 }}
            />
          </div>
          <div>
            <CsSlug className="mb-2">1 unit = ₦</CsSlug>
            <input
              value={fxNairaPerUnit}
              onChange={(e) => setFxNairaPerUnit(e.target.value)}
              placeholder="1500"
              inputMode="decimal"
              style={{ ...fieldStyle, width: 140 }}
            />
          </div>
          <CsButton onClick={saveFxRate} disabled={fxSaving} variant="rust">
            {fxSaving ? 'Saving…' : 'Save rate'}
          </CsButton>
        </div>

        <div className="mt-5">
          {fxLoading ? (
            <div className="h-16" style={{ background: 'var(--cs-panel)', border: '1.5px solid var(--cs-line)' }} />
          ) : fxOverrides.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--cs-muted)' }}>
              No admin rates set. Every currency is priced off the live exchange rate.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--cs-line)' }}>
                  <th className="text-left py-2 cs-mono" style={{ color: 'var(--cs-muted)' }}>Currency</th>
                  <th className="text-right py-2 cs-mono" style={{ color: 'var(--cs-muted)' }}>Admin rate</th>
                  <th className="text-right py-2 cs-mono" style={{ color: 'var(--cs-muted)' }}>Live rate</th>
                  <th className="text-right py-2" />
                </tr>
              </thead>
              <tbody>
                {fxOverrides.map((o) => {
                  const liveRate = fxLiveRates[o.currency];
                  return (
                    <tr key={o.currency} style={{ borderBottom: '1px solid var(--cs-line)' }}>
                      <td className="py-2 cs-mono font-bold" style={{ color: 'var(--cs-ink)' }}>{o.currency}</td>
                      <td className="py-2 text-right cs-mono" style={{ color: 'var(--cs-ink)' }}>
                        1 {o.currency} = {formatCurrency(Math.round(1 / o.rate))}
                      </td>
                      <td className="py-2 text-right cs-mono" style={{ color: 'var(--cs-muted)' }}>
                        {liveRate ? `1 ${o.currency} = ${formatCurrency(Math.round(1 / liveRate))}` : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeFxRate(o.currency)}
                          className="cs-mono text-xs underline"
                          style={{ color: 'var(--cs-rust)' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
