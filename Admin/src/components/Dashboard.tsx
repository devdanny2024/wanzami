import { useEffect, useState } from "react";
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
import { CsBox, CsEmpty, CsPageHeader, CsSlug, CsStat } from "./cs/kit";

type DashboardStats = {
  totalUsers: number;
  activeViewersNow: number;
  streamsLast24h: number;
  newUsersLast7Days: number;
  ppvPurchasesToday: number;
  totalPpvRevenueNaira: number;
  ppvRevenueLast7DaysNaira: number;
  moviesAndSeriesCount: number;
};

type DailyStreamsPoint = { date: string; streams: number };
type DailyRevenuePoint = { date: string; revenue: number };

type DashboardResponse = {
  stats: DashboardStats;
  dailyStreams: DailyStreamsPoint[];
  dailyRevenue: DailyRevenuePoint[];
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

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyStreams, setDailyStreams] = useState<DailyStreamsPoint[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenuePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/dashboard/summary?days=30&engagementHours=24&activeMinutes=1", {
          method: "GET",
          headers: {
            ...authHeaders(),
          },
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load dashboard (${res.status})`);
        }
        const data = (await res.json()) as DashboardResponse;
        setStats(data.stats);
        setDailyStreams(data.dailyStreams ?? []);
        setDailyRevenue(data.dailyRevenue ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const cards =
    stats === null
      ? []
      : [
          { label: "Total users", value: formatNumber(stats.totalUsers) },
          { label: "New users · 7 days", value: formatNumber(stats.newUsersLast7Days) },
          { label: "Watching right now", value: formatNumber(stats.activeViewersNow) },
          { label: "Streams · last 24h", value: formatNumber(stats.streamsLast24h) },
          { label: "PPV tickets today", value: formatNumber(stats.ppvPurchasesToday) },
          { label: "PPV revenue · 7 days", value: formatCurrency(stats.ppvRevenueLast7DaysNaira) },
          { label: "PPV revenue · all time", value: formatCurrency(stats.totalPpvRevenueNaira) },
          { label: "Titles on the slate", value: formatNumber(stats.moviesAndSeriesCount) },
        ];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The daily report"
        chip={today}
        slug="Production office · real numbers only"
      />

      {error && (
        <CsEmpty
          slug="Report unavailable"
          body={`${error}. Refresh to try again.`}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading && !stats
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-28"
                style={{ background: "var(--cs-panel)", border: "1.5px solid var(--cs-line)" }}
              />
            ))
          : cards.map((stat) => (
              <CsStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CsBox className="p-5">
          <CsSlug>Reel A · Daily streams · last 7 days</CsSlug>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyStreams}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e3e0da" />
                <XAxis dataKey="date" tick={chartAxisTick} stroke="#161310" />
                <YAxis tick={chartAxisTick} stroke="#161310" allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#6e6a64" }} />
                <Line
                  type="monotone"
                  dataKey="streams"
                  stroke="#d1490f"
                  strokeWidth={2.5}
                  dot={{ fill: "#d1490f", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CsBox>

        <CsBox className="p-5">
          <CsSlug>Box office · Daily PPV revenue (NGN)</CsSlug>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e3e0da" />
                <XAxis dataKey="date" tick={chartAxisTick} stroke="#161310" />
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
    </div>
  );
}
