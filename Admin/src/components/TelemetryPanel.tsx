import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type EventCount = { eventType: string; count: number };

export function TelemetryPanel() {
  const [hours, setHours] = useState(24);
  const [counts, setCounts] = useState<EventCount[]>([]);
  const [prevCounts, setPrevCounts] = useState<EventCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/admin/events/summary?hours=${hours}`, {
          headers: { ...authHeaders() },
          cache: "no-store",
        }),
        fetch(`/api/admin/events/summary?hours=${hours * 2}`, {
          headers: { ...authHeaders() },
          cache: "no-store",
        }),
      ]);
      if (!currentRes.ok) throw new Error(`Failed to load events (${currentRes.status})`);
      if (!prevRes.ok) throw new Error(`Failed to load prev events (${prevRes.status})`);
      const currentData = await currentRes.json();
      const prevData = await prevRes.json();
      const currCounts = Array.isArray(currentData.counts) ? currentData.counts : [];
      const prevWindowCounts = Array.isArray(prevData.counts) ? prevData.counts : [];
      // Previous period = 48h window minus current 24h, per event type
      const currMap = new Map<string, number>();
      currCounts.forEach((c: any) => currMap.set(c.eventType, c.count));
      const prevPeriod = prevWindowCounts.map((c: any) => ({
        eventType: c.eventType,
        count: Math.max(0, (c.count ?? 0) - (currMap.get(c.eventType) ?? 0)),
      }));
      setCounts(currCounts);
      setPrevCounts(prevPeriod);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hours]);

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Telemetry (last {hours}h)</CardTitle>
          <p className="text-sm text-neutral-400">Event counts and recent activity</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="bg-neutral-800 text-white text-sm rounded px-2 py-1 border border-neutral-700"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {[1, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>
                {h}h
              </option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="text-neutral-200">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="text-red-400 text-sm">Error: {error}</div>}
        {mergeCounts(counts, prevCounts).length === 0 && !loading ? (
          <div className="text-neutral-500 text-sm">No events in the selected window.</div>
        ) : (
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mergeCounts(counts, prevCounts)}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="eventType" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#171717", border: "1px solid #404040", borderRadius: 8 }}
                  labelStyle={{ color: "#a3a3a3" }}
                />
                <Legend />
                <Bar dataKey="current" fill="#fd7e14" radius={[4, 4, 0, 0]} name={`Last ${hours}h`} />
                <Bar dataKey="previous" fill="#6b7280" radius={[4, 4, 0, 0]} name={`Prev ${hours}h`} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function mergeCounts(current: EventCount[], previous: EventCount[]) {
  const map = new Map<string, { eventType: string; current: number; previous: number }>();
  current.forEach((c) => {
    map.set(c.eventType, { eventType: c.eventType, current: c.count, previous: 0 });
  });
  previous.forEach((p) => {
    const existing = map.get(p.eventType);
    if (existing) {
      existing.previous = p.count;
    } else {
      map.set(p.eventType, { eventType: p.eventType, current: 0, previous: p.count });
    }
  });
  return Array.from(map.values());
}
