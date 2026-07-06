import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchPpvPurchases, type PpvPurchase } from "@/lib/paymentsClient";
import { CsBox, CsEmpty, CsPageHeader, CsSlug, CsStat } from "./cs/kit";

type DailyStreamsPoint = { date: string; streams: number };
type DailyRevenuePoint = { date: string; revenue: number };

type SummaryResponse = {
  stats?: { activeViewersNow?: number; streamsLast24h?: number };
  dailyStreams?: DailyStreamsPoint[];
  dailyRevenue?: DailyRevenuePoint[];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const authHeaders = () => {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessToken")
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const chartAxisTick = {
  fontFamily: "var(--font-smono), monospace",
  fontSize: 10,
  fill: "#6e6a64",
};

const chartTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "2px solid #161310",
  borderRadius: 0,
  fontFamily: "var(--font-smono), monospace",
  fontSize: 11,
};

export function Analytics() {
  const [dailyStreams, setDailyStreams] = useState<DailyStreamsPoint[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenuePoint[]>([]);
  const [purchases, setPurchases] = useState<PpvPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const [summaryRes, purchasesRes] = await Promise.allSettled([
          fetch("/api/admin/dashboard/summary?days=30", {
            headers: { ...authHeaders() },
            cache: "no-store",
          }).then(async (r) => {
            if (!r.ok) throw new Error(`Summary failed (${r.status})`);
            return (await r.json()) as SummaryResponse;
          }),
          fetchPpvPurchases(token),
        ]);

        if (summaryRes.status === "fulfilled") {
          setDailyStreams(summaryRes.value.dailyStreams ?? []);
          setDailyRevenue(summaryRes.value.dailyRevenue ?? []);
        } else {
          setError("Could not load streaming history.");
        }
        if (purchasesRes.status === "fulfilled") {
          setPurchases(purchasesRes.value.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totals = useMemo(() => {
    const streams = dailyStreams.reduce((sum, p) => sum + (p.streams ?? 0), 0);
    const revenue = dailyRevenue.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
    const best = dailyStreams.reduce(
      (best, p) => (p.streams > (best?.streams ?? -1) ? p : best),
      null as DailyStreamsPoint | null,
    );
    const success = purchases.filter((p) => p.status === "SUCCESS");
    return {
      streams,
      revenue,
      bestDay: best && best.streams > 0 ? best.date : null,
      ticketsSold: success.length,
    };
  }, [dailyStreams, dailyRevenue, purchases]);

  const topTitles = useMemo(() => {
    const byTitle = new Map<string, { name: string; purchases: number; revenue: number }>();
    for (const p of purchases) {
      if (p.status !== "SUCCESS") continue;
      const key = p.titleId ?? p.title?.id ?? "unknown";
      const entry = byTitle.get(key) ?? {
        name: p.title?.name ?? "Unknown title",
        purchases: 0,
        revenue: 0,
      };
      entry.purchases += 1;
      entry.revenue += p.amountNaira ?? 0;
      byTitle.set(key, entry);
    }
    return Array.from(byTitle.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [purchases]);

  const maxTitleRevenue = topTitles[0]?.revenue ?? 0;

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The numbers"
        chip="Last 30 days"
        slug="Analytics · measured, not projected"
      />

      {error && <CsEmpty slug="Partial report" body={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28"
              style={{ background: "var(--cs-panel)", border: "1.5px solid var(--cs-line)" }}
            />
          ))
        ) : (
          <>
            <CsStat label="Streams · 30 days" value={formatNumber(totals.streams)} />
            <CsStat label="PPV revenue · 30 days" value={formatCurrency(totals.revenue)} />
            <CsStat label="Tickets sold · all time" value={formatNumber(totals.ticketsSold)} />
            <CsStat
              label="Busiest day"
              value={totals.bestDay ?? "—"}
              hint={totals.bestDay ? undefined : "No streams recorded yet"}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CsBox className="p-5">
          <CsSlug>Reel A · Streams per day · 30 days</CsSlug>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyStreams}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e3e0da" />
                <XAxis dataKey="date" tick={chartAxisTick} stroke="#161310" minTickGap={24} />
                <YAxis tick={chartAxisTick} stroke="#161310" allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#6e6a64" }} />
                <Line
                  type="monotone"
                  dataKey="streams"
                  stroke="#d1490f"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CsBox>

        <CsBox className="p-5">
          <CsSlug>Box office · Revenue per day (NGN) · 30 days</CsSlug>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e3e0da" />
                <XAxis dataKey="date" tick={chartAxisTick} stroke="#161310" minTickGap={24} />
                <YAxis tick={chartAxisTick} stroke="#161310" allowDecimals={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: "#6e6a64" }}
                  formatter={(value: number) => formatCurrency(value as number)}
                />
                <Bar dataKey="revenue" fill="#fd7e14" stroke="#161310" strokeWidth={1.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CsBox>
      </div>

      <CsBox className="p-5">
        <CsSlug>Top titles by PPV revenue · all time</CsSlug>
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="h-20" style={{ background: "var(--cs-panel)" }} />
          ) : topTitles.length === 0 ? (
            <CsEmpty
              slug="No sales recorded yet"
              body="When tickets sell, the ranking shows up here with real purchase counts."
            />
          ) : (
            topTitles.map((t, index) => (
              <div key={t.name} className="flex items-center gap-4">
                <div
                  className="cs-display w-8 h-8 flex items-center justify-center text-lg"
                  style={{ background: "var(--cs-ink)", color: "var(--cs-brand)" }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-ink)" }}>
                      {t.name}
                    </span>
                    <span className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                      {t.purchases} ticket{t.purchases === 1 ? "" : "s"} · {formatCurrency(t.revenue)}
                    </span>
                  </div>
                  <div className="h-2.5" style={{ border: "1.5px solid var(--cs-ink)" }}>
                    <div
                      className="h-full"
                      style={{
                        background: "var(--cs-brand)",
                        width: `${maxTitleRevenue > 0 ? Math.max(4, (t.revenue / maxTitleRevenue) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CsBox>
    </div>
  );
}
