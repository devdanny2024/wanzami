import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Eye, CreditCard, DollarSign, Film, FileText } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TelemetryPanel } from "./TelemetryPanel";

type DashboardStats = {
  totalUsers: number;
  activeViewersNow: number;
  ppvPurchasesToday: number;
  totalPpvRevenueNaira: number;
  moviesAndSeriesCount: number;
  blogPostsPublished: number;
};

type DailyStreamsPoint = { date: string; streams: number };
type DailyRevenuePoint = { date: string; revenue: number };
type EngagementPoint = { hour: string; views: number };

type DashboardResponse = {
  stats: DashboardStats;
  dailyStreams: DailyStreamsPoint[];
  dailyRevenue: DailyRevenuePoint[];
  contentEngagement: EngagementPoint[];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyStreams, setDailyStreams] = useState<DailyStreamsPoint[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenuePoint[]>([]);
  const [contentEngagement, setContentEngagement] = useState<EngagementPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/dashboard/summary", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load dashboard (${res.status})`);
        }
        const data = (await res.json()) as DashboardResponse;
        setStats(data.stats);
        setDailyStreams(data.dailyStreams);
        setDailyRevenue(data.dailyRevenue);
        setContentEngagement(data.contentEngagement);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const cards =
    stats === null
      ? []
      : [
          {
            title: "Total Users",
            value: formatNumber(stats.totalUsers),
            icon: Users,
          },
          {
            title: "Active Viewers Now",
            value: formatNumber(stats.activeViewersNow),
            icon: Eye,
          },
          {
            title: "PPV Purchases Today",
            value: formatNumber(stats.ppvPurchasesToday),
            icon: CreditCard,
          },
          {
            title: "Total PPV Revenue",
            value: formatCurrency(stats.totalPpvRevenueNaira),
            icon: DollarSign,
          },
          {
            title: "Movies & Series Count",
            value: formatNumber(stats.moviesAndSeriesCount),
            icon: Film,
          },
          {
            title: "Blog Posts Published",
            value: formatNumber(stats.blogPostsPublished),
            icon: FileText,
          },
        ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl text-white">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Platform overview and key metrics</p>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !stats && (
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="py-10 text-neutral-400 text-sm">
              Loading dashboard metrics...
            </CardContent>
          </Card>
        )}
        {!loading &&
          cards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="bg-neutral-900 border-neutral-800 hover:border-[#fd7e14]/50 transition-all hover:shadow-lg hover:shadow-[#fd7e14]/10"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-neutral-400">
                    {stat.title}
                  </CardTitle>
                  <Icon className="w-4 h-4 text-[#fd7e14]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-white">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Streams */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Daily Streams</CardTitle>
            <p className="text-sm text-neutral-400">Last 7 days streaming activity</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStreams}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a3a3a3" }}
                />
                <Line
                  type="monotone"
                  dataKey="streams"
                  stroke="#fd7e14"
                  strokeWidth={2}
                  dot={{ fill: "#fd7e14" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily PPV Revenue */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Daily PPV Revenue (NGN)</CardTitle>
            <p className="text-sm text-neutral-400">Last 7 days revenue</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a3a3a3" }}
                  formatter={(value: number) => formatCurrency(value as number)}
                />
                <Bar
                  dataKey="revenue"
                  fill="#fd7e14"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry */}
      <TelemetryPanel />

      {/* Content Engagement */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Content Engagement</CardTitle>
          <p className="text-sm text-neutral-400">Hourly viewing patterns</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={contentEngagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="hour" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#a3a3a3" }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#fd7e14"
                fill="#fd7e14"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

