import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { RefreshCw } from "lucide-react";

type EventCount = { eventType: string; count: number };
type RecentEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  profileId: string | null;
  profileName: string | null;
  titleId: string | null;
  titleName: string | null;
  country: string | null;
  completionPercent?: number;
  deviceId: string | null;
};

export function TelemetryPanel() {
  const [hours, setHours] = useState(24);
  const [counts, setCounts] = useState<EventCount[]>([]);
  const [recent, setRecent] = useState<RecentEvent[]>([]);
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
      const res = await fetch(`/api/admin/events/summary?hours=${hours}`, {
        headers: { ...authHeaders() },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Failed to load events (${res.status})`);
      }
      const data = await res.json();
      setCounts(Array.isArray(data.counts) ? data.counts : []);
      setRecent(Array.isArray(data.recent) ? data.recent : []);
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
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => (
            <Badge key={c.eventType} variant="secondary" className="bg-neutral-800 text-white">
              {c.eventType}: {c.count}
            </Badge>
          ))}
          {!counts.length && !loading && <span className="text-neutral-500 text-sm">No events in window.</span>}
        </div>
        <div className="overflow-auto rounded border border-neutral-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-neutral-400">Time</TableHead>
                <TableHead className="text-neutral-400">Type</TableHead>
                <TableHead className="text-neutral-400">Profile</TableHead>
                <TableHead className="text-neutral-400">Title</TableHead>
                <TableHead className="text-neutral-400">Country</TableHead>
                <TableHead className="text-neutral-400">Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-white text-sm">
                    {new Date(e.occurredAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-white text-sm">{e.eventType}</TableCell>
                  <TableCell className="text-neutral-300 text-sm">
                    {e.profileName ?? e.profileId ?? "-"}
                  </TableCell>
                  <TableCell className="text-neutral-300 text-sm">
                    {e.titleName ?? e.titleId ?? "-"}
                  </TableCell>
                  <TableCell className="text-neutral-300 text-sm">{e.country ?? "-"}</TableCell>
                  <TableCell className="text-neutral-300 text-sm">
                    {e.completionPercent !== undefined ? `${Math.round(e.completionPercent * 100)}%` : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {!recent.length && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-neutral-500 text-sm">
                    No recent events
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
